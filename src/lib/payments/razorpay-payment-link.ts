import { getRazorpay } from "@/lib/razorpay";

/**
 * Razorpay Payment Link creation for mid-call UPI collection (Item 8).
 * Remember: Razorpay amounts are in PAISE (₹1 = 100 paise).
 *
 * Razorpay sends the link to the caller by SMS itself (notify.sms) — the
 * agent never has to read a URL aloud. `notes.sessionId` round-trips through
 * the payment_link.paid webhook so we can stamp the AgentSession.
 */

export interface PaymentLinkResult {
  ok: boolean;
  linkId?: string;
  shortUrl?: string;
  error?: string;
}

export async function createPaymentLink(opts: {
  amountPaise: number;
  description: string;
  customerName?: string | null;
  customerPhone: string; // E.164 or Indian 10-digit
  sessionId: string;
  businessId: string;
  expiresInMinutes?: number;
}): Promise<PaymentLinkResult> {
  const razorpay = getRazorpay();
  if (!razorpay) return { ok: false, error: "Razorpay not configured" };

  const digits = opts.customerPhone.replace(/\D/g, "");
  const contact = digits.length === 10 ? `+91${digits}` : `+${digits}`;

  try {
    const link = (await razorpay.paymentLink.create({
      amount: opts.amountPaise,
      currency: "INR",
      description: opts.description.slice(0, 250),
      customer: {
        name: opts.customerName || "Caller",
        contact,
      },
      notify: { sms: true },
      reminder_enable: false,
      expire_by: Math.floor(Date.now() / 1000) + (opts.expiresInMinutes ?? 60) * 60,
      notes: { sessionId: opts.sessionId, businessId: opts.businessId, source: "voxie-voice-agent" },
    })) as { id?: string; short_url?: string };

    if (!link.id) return { ok: false, error: "Razorpay returned no link id" };
    return { ok: true, linkId: link.id, shortUrl: link.short_url };
  } catch (err) {
    const message =
      (err as { error?: { description?: string } })?.error?.description ||
      (err instanceof Error ? err.message : "Payment link creation failed");
    return { ok: false, error: message };
  }
}
