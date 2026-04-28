import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { sendLeadCaptureEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/url";

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
        "User-Agent": "AgentHub-Webhook/1.0",
        "X-AgentHub-Event": payload.event,
        "X-AgentHub-Signature": `sha256=${signature}`,
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
}

/**
 * Notify the business owner that a session ran on their agent.
 *
 * Idempotent: sets AgentSession.leadDeliveredAt on success and refuses to
 * re-send if it's already set. Safe to call from a retried Inngest job.
 *
 * Skips low-signal calls (no captured lead AND empty/short transcript) so
 * owners aren't spammed by the inevitable mis-clicks and connection-test calls.
 */
export async function deliverLead(sessionId: string): Promise<LeadDeliveryResult> {
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
      if (!webhookResult.ok) {
        console.warn(
          `[LeadDelivery] webhook ${business.webhookUrl} failed:`,
          webhookResult.status ?? webhookResult.error,
        );
      }
    }
  }

  return { delivered: true, webhook: webhookResult };
}
