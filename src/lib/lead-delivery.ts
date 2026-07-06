import { createHmac, randomBytes } from "node:crypto";
import { traceable } from "langsmith/traceable";
import { prisma } from "@/lib/db";
import { sendLeadCaptureEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/url";
import { isWhatsAppConfigured, sendWhatsAppText } from "@/lib/whatsapp";
import { pushLeadToCrm } from "@/lib/crm";

interface CapturedLeadShape {
  name?: string;
  phone?: string;
  email?: string;
  intent: string;
  urgency?: "low" | "medium" | "high";
  notes?: string;
  capturedAt?: string;
}

export interface LeadDeliveryResult {
  delivered: boolean;
  reason?: string;
  webhook?: { attempted: boolean; ok?: boolean; status?: number; error?: string };
  whatsapp?: { attempted: boolean; ok?: boolean; error?: string };
  crm?: { attempted: boolean; ok?: boolean; recordId?: string; error?: string };
}

/**
 * Lazily mint a webhook signing secret on the Business if the URL is set
 * but no secret exists yet. The owner gets to read it from the settings
 * page after first use.
 */
async function ensureWebhookSecret(businessId: string, current: string | null): Promise<string | null> {
  if (current) return current;
  const fresh = randomBytes(32).toString("hex");
  await prisma.business.update({
    where: { id: businessId },
    data: { webhookSecret: fresh },
  });
  return fresh;
}

interface WebhookPayload {
  event: "lead.captured";
  deliveredAt: string;
  business: { id: string; name: string; slug: string };
  agent: { id: string; name: string; templateType: string };
  session: {
    id: string;
    createdAt: string;
    durationSeconds: number | null;
    transcriptUrl: string;
  };
  caller: { name: string | null; phone: string | null; email: string | null };
  lead: { intent: string; urgency?: string; notes?: string } | null;
  analysis: {
    summary: string | null;
    sentiment: string | null;
    sentimentScore: number | null;
    topics: string[];
    escalated: boolean;
  };
}

const deliverWebhook = traceable(
  async function deliverWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<NonNullable<LeadDeliveryResult["webhook"]>> {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Voxie-Webhook/1.0",
        "X-Voxie-Event": payload.event,
        "X-Voxie-Signature": `sha256=${signature}`,
      },
      body,
      // 10s ceiling — receivers should ack fast; long pauses are queueing tools' job.
      signal: AbortSignal.timeout(10_000),
    });
    return { attempted: true, ok: res.ok, status: res.status };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
  },
  { name: "deliverWebhook", run_type: "tool" },
);

/**
 * Notify the business owner that a session ran on their agent.
 *
 * Idempotent: sets AgentSession.leadDeliveredAt on success and refuses to
 * re-send if it's already set. Safe to call from a retried Inngest job.
 *
 * Skips low-signal calls (no captured lead AND empty/short transcript) so
 * owners aren't spammed by the inevitable mis-clicks and connection-test calls.
 */
export const deliverLead = traceable(
  async function deliverLead(sessionId: string): Promise<LeadDeliveryResult> {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: {
      agent: {
        include: {
          business: {
            include: { owner: { select: { email: true, name: true } } },
          },
        },
      },
    },
  });

  if (!session) return { delivered: false, reason: "session not found" };
  if (session.leadDeliveredAt) return { delivered: false, reason: "already delivered" };

  const agent = session.agent;
  const business = agent?.business;
  if (!agent || !business) return { delivered: false, reason: "agent/business missing" };

  const lead = (session.capturedLead as unknown as CapturedLeadShape) || null;
  const transcriptLen = Array.isArray(session.transcript) ? (session.transcript as unknown[]).length : 0;
  const hasSignal = !!lead || transcriptLen >= 4 || !!session.summary;
  if (!hasSignal) return { delivered: false, reason: "low-signal call (no lead, short transcript)" };

  // Honour per-business opt-out for the lead-capture email channel.
  // Missing key = default ON, matches the PATCH handler's coercion.
  const prefs = (business.notificationPrefs as { leadCapture?: boolean } | null) ?? null;
  if (prefs && prefs.leadCapture === false) {
    return { delivered: false, reason: "leadCapture email disabled in prefs" };
  }

  const recipient = business.notificationEmail || business.owner?.email;
  if (!recipient) {
    // No notificationEmail set AND owner has no email on file. The lead is
    // captured in the DB but cannot be delivered. Log loudly so Sentry/log
    // aggregation surfaces it — a customer paying for the product should not
    // silently lose leads.
    console.error(
      `[LeadDelivery] DROPPED — no recipient email`,
      { sessionId, businessId: business.id, businessName: business.name },
    );
    return { delivered: false, reason: "no recipient email on business or owner" };
  }

  const caller = {
    name: lead?.name || session.callerName,
    phone: lead?.phone || session.callerPhone,
    email: lead?.email || session.callerEmail,
  };

  await sendLeadCaptureEmail({
    to: recipient,
    ownerName: business.owner?.name || "",
    businessName: business.name,
    agentName: agent.name,
    sessionId: session.id,
    capturedAt: session.createdAt,
    durationSeconds: session.duration,
    caller,
    lead: lead
      ? {
          intent: lead.intent,
          urgency: lead.urgency,
          notes: lead.notes,
        }
      : null,
    analysis: {
      summary: session.summary,
      sentiment: session.sentiment,
      topics: session.topics,
      escalated: session.escalated,
    },
  });

  // Stamp idempotency marker AFTER successful email send so a transient
  // Resend failure leaves the row in "deliverable" state for the next retry.
  // Webhook is delivered separately below — its outcome doesn't gate
  // idempotency (we don't want to re-spam the email if only the webhook flapped).
  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { leadDeliveredAt: new Date() },
  });

  // Optional outbound webhook (Slack/HubSpot/Zapier/etc).
  let webhookResult: LeadDeliveryResult["webhook"] = { attempted: false };
  if (business.webhookUrl) {
    const secret = await ensureWebhookSecret(business.id, business.webhookSecret);
    if (secret) {
      const startedAt = Date.now();
      webhookResult = await deliverWebhook(business.webhookUrl, secret, {
        event: "lead.captured",
        deliveredAt: new Date().toISOString(),
        business: { id: business.id, name: business.name, slug: business.slug },
        agent: { id: agent.id, name: agent.name, templateType: agent.templateType },
        session: {
          id: session.id,
          createdAt: session.createdAt.toISOString(),
          durationSeconds: session.duration,
          transcriptUrl: `${getAppUrl()}/business/sessions/${session.id}`,
        },
        caller,
        lead: lead ? { intent: lead.intent, urgency: lead.urgency, notes: lead.notes } : null,
        analysis: {
          summary: session.summary,
          sentiment: session.sentiment,
          sentimentScore: session.sentimentScore,
          topics: session.topics,
          escalated: session.escalated,
        },
      });
      const latencyMs = Date.now() - startedAt;

      // Persist the attempt so owners can see it in the Settings page. Best-effort —
      // a failed log row should never mask the actual delivery outcome.
      prisma.webhookDelivery
        .create({
          data: {
            businessId: business.id,
            sessionId: session.id,
            url: business.webhookUrl,
            event: "lead.captured",
            statusCode: webhookResult.status ?? null,
            latencyMs,
            errorMessage: webhookResult.error ?? null,
            ok: !!webhookResult.ok,
          },
        })
        .catch((err) => {
          console.warn("[LeadDelivery] failed to record webhook delivery row:", err);
        });

      if (!webhookResult.ok) {
        console.warn(
          `[LeadDelivery] webhook ${business.webhookUrl} failed:`,
          webhookResult.status ?? webhookResult.error,
        );
      }
    }
  }

    // Optional CRM push (Item 9). Gated on per-business connector + a real
    // captured lead + not yet pushed. Failures are stamped on the session
    // (crmError) so the owner sees a red badge + can re-push — never blocks
    // the email/webhook/WhatsApp channels.
    let crmResult: LeadDeliveryResult["crm"] = { attempted: false };
    if (business.crmProvider && business.crmSecretEncrypted && lead && !session.crmPushedAt) {
      crmResult = await pushLeadToCrm({
        provider: business.crmProvider,
        secretEncrypted: business.crmSecretEncrypted,
        config: business.crmConfig,
        lead: {
          name: caller.name,
          phone: caller.phone,
          email: caller.email,
          intent: lead.intent,
          notes: lead.notes,
        },
      });
      await prisma.agentSession
        .update({
          where: { id: sessionId },
          data: {
            crmPushedAt: crmResult.ok ? new Date() : null,
            crmRecordId: crmResult.recordId ?? null,
            crmError: crmResult.ok ? null : (crmResult.error ?? "unknown error").slice(0, 1000),
          },
        })
        .catch((err) => console.warn("[LeadDelivery] CRM status write failed:", err));
      if (!crmResult.ok) {
        console.warn(`[LeadDelivery] CRM push (${business.crmProvider}) failed:`, crmResult.error);
      }
    }

    // Optional WhatsApp confirmation to the CALLER (Item 4). Fully gated:
    // platform env + per-business toggle + a usable phone + not yet sent.
    // Failures never affect the email/webhook outcome above.
    let whatsappResult: LeadDeliveryResult["whatsapp"] = { attempted: false };
    if (
      business.whatsappEnabled &&
      isWhatsAppConfigured() &&
      lead &&
      caller.phone &&
      !session.whatsappDeliveredAt
    ) {
      whatsappResult = await deliverWhatsAppConfirmation({
        sessionId: session.id,
        businessName: business.name,
        fromNumber: business.whatsappFromNumber,
        callerName: caller.name,
        callerPhone: caller.phone,
        intent: lead.intent,
      });
    }

    return { delivered: true, webhook: webhookResult, whatsapp: whatsappResult, crm: crmResult };
  },
  { name: "deliverLead", run_type: "chain" },
);

/** Send the templated confirmation and stamp idempotency + status on the session. */
const deliverWhatsAppConfirmation = traceable(
  async function deliverWhatsAppConfirmation(opts: {
    sessionId: string;
    businessName: string;
    fromNumber: string | null;
    callerName: string | null;
    callerPhone: string;
    intent: string;
  }): Promise<NonNullable<LeadDeliveryResult["whatsapp"]>> {
    const greeting = opts.callerName ? `Hi ${opts.callerName}` : "Hi";
    const text =
      `${greeting}, thanks for contacting ${opts.businessName}! ` +
      `We've noted your request: "${opts.intent.slice(0, 200)}". ` +
      `Our team will get back to you shortly.`;

    const result = await sendWhatsAppText({
      to: opts.callerPhone,
      text,
      from: opts.fromNumber,
    });

    await prisma.agentSession
      .update({
        where: { id: opts.sessionId },
        data: {
          whatsappDeliveredAt: result.ok ? new Date() : null,
          whatsappMessageId: result.messageId ?? null,
          whatsappStatus: result.ok ? "sent" : "failed",
        },
      })
      .catch((err) => console.warn("[LeadDelivery] WhatsApp status write failed:", err));

    if (!result.ok) {
      console.warn(`[LeadDelivery] WhatsApp confirmation failed:`, result.error);
    }
    return { attempted: true, ok: result.ok, error: result.error };
  },
  { name: "deliverWhatsAppConfirmation", run_type: "tool" },
);
