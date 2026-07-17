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

/**
 * Owner-facing invoice link (Item 13 overage billing). Email-notified rather
 * than SMS — this goes to the business owner, not an anonymous caller.
 * Longer expiry (7 days) since it's a monthly invoice, not a mid-call nudge.
 */
export async function createInvoiceLink(opts: {
  amountPaise: number;
  description: string;
  customerName: string;
  customerEmail: string;
  notes: Record<string, string>;
}): Promise<PaymentLinkResult> {
  const razorpay = getRazorpay();
  if (!razorpay) return { ok: false, error: "Razorpay not configured" };

  try {
    const link = (await razorpay.paymentLink.create({
      amount: opts.amountPaise,
      currency: "INR",
      description: opts.description.slice(0, 250),
      customer: { name: opts.customerName, email: opts.customerEmail },
      notify: { email: true },
      reminder_enable: true,
      expire_by: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      notes: opts.notes,
    })) as { id?: string; short_url?: string };

    if (!link.id) return { ok: false, error: "Razorpay returned no link id" };
    return { ok: true, linkId: link.id, shortUrl: link.short_url };
  } catch (err) {
    const message =
      (err as { error?: { description?: string } })?.error?.description ||
      (err instanceof Error ? err.message : "Invoice link creation failed");
    return { ok: false, error: message };
  }
}
