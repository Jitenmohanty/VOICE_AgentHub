import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createPaymentLink } from "@/lib/payments/razorpay-payment-link";
import { authenticateBookingRequest, extractSessionToken } from "@/lib/calendar/booking";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { checkTransactionRateLimit } from "@/lib/ratelimit";
import { isWhatsAppConfigured, sendWhatsAppText } from "@/lib/whatsapp";

/**
 * POST /api/public/agent/[slug]/payment-link
 * Called by the in-call `generatePaymentLink` tool. Server-side enforcement
 * of everything the prompt promises:
 *   - per-session bearer token (same auth as booking/search-knowledge)
 *   - Agent.config.paymentEnabled must be true
 *   - amount capped at Agent.config.maxPaymentAmountInr (default ₹2,000)
 * Razorpay SMSes the link to the caller; if the business has WhatsApp on,
 * a WhatsApp copy goes out too. Failures return tool-shaped messages the
 * model can act on, never HTTP errors mid-conversation.
 */

const DEFAULT_MAX_INR = 2000;

const BodySchema = z.object({
  sessionId: z.string().cuid(),
  amountInr: z.number().positive().max(1_000_000),
  description: z.string().min(3).max(250),
  phone: z.string().min(5).max(30),
  name: z.string().max(200).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const limited = await checkTransactionRateLimit(request);
    if (limited) return limited;

    const parse = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? "Bad request" }, { status: 400 });
    }
    const { sessionId, amountInr, description, phone, name } = parse.data;

    const auth = await authenticateBookingRequest(slug, sessionId, extractSessionToken(request));
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: "payments_unavailable", message: "Payments are not available — continue without payment." });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: auth.agentId },
      select: { config: true, business: { select: { id: true, whatsappEnabled: true, whatsappFromNumber: true, name: true } } },
    });
    const config = (agent?.config ?? {}) as Record<string, unknown>;
    if (config.paymentEnabled !== true) {
      return NextResponse.json({ error: "payments_disabled", message: "Payments are not enabled for this business — continue without payment." });
    }

    const maxInr = typeof config.maxPaymentAmountInr === "number" && config.maxPaymentAmountInr > 0
      ? config.maxPaymentAmountInr
      : DEFAULT_MAX_INR;
    if (amountInr > maxInr) {
      return NextResponse.json({
        error: "amount_over_limit",
        message: `That amount exceeds the business's configured limit of ₹${maxInr}. Do not send a link; tell the caller the team will handle payment on follow-up.`,
      });
    }

    const result = await createPaymentLink({
      amountPaise: Math.round(amountInr * 100),
      description,
      customerName: name ?? null,
      customerPhone: phone,
      sessionId,
      businessId: auth.businessId,
      expiresInMinutes: 60,
    });

    if (!result.ok || !result.linkId) {
      console.warn("[payment-link] creation failed:", result.error);
      return NextResponse.json({
        error: "payment_link_failed",
        message: "The payment link could not be created — apologize and continue without payment.",
      });
    }

    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        paymentLinkId: result.linkId,
        paymentAmountPaise: Math.round(amountInr * 100),
        ...(name ? { callerName: name } : {}),
        callerPhone: phone,
      },
    });

    // Bonus channel: WhatsApp copy of the link when the business has it on.
    const business = agent?.business;
    if (business?.whatsappEnabled && isWhatsAppConfigured() && result.shortUrl) {
      void sendWhatsAppText({
        to: phone,
        text: `Payment link from ${business.name}: ${result.shortUrl}\n₹${amountInr} — ${description}\nPay with any UPI app. Link valid for 1 hour.`,
        from: business.whatsappFromNumber,
      }).catch(() => null);
    }

    return NextResponse.json({
      sent: true,
      amountInr,
      message: `Payment link for ₹${amountInr} sent to the caller's phone by SMS${business?.whatsappEnabled ? " and WhatsApp" : ""}. Tell them to complete it with any UPI app within 1 hour. You cannot see whether they have paid.`,
    });
  } catch (err) {
    console.error("[payment-link] failed:", err);
    return NextResponse.json({
      error: "payment_link_failed",
      message: "The payment link could not be created — apologize and continue without payment.",
    });
  }
}
