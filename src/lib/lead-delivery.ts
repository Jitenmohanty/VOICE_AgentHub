import { prisma } from "@/lib/db";
import { sendLeadCaptureEmail } from "@/lib/email";

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
  if (!recipient) return { delivered: false, reason: "no recipient email on business or owner" };

  await sendLeadCaptureEmail({
    to: recipient,
    ownerName: business.owner?.name || "",
    businessName: business.name,
    agentName: agent.name,
    sessionId: session.id,
    capturedAt: session.createdAt,
    durationSeconds: session.duration,
    caller: {
      name: lead?.name || session.callerName,
      phone: lead?.phone || session.callerPhone,
      email: lead?.email || session.callerEmail,
    },
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

  // Stamp idempotency marker AFTER successful send so a transient Resend
  // failure leaves the row in "deliverable" state for the next retry.
  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { leadDeliveredAt: new Date() },
  });

  return { delivered: true };
}
