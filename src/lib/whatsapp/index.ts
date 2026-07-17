import { sendViaGupshup } from "@/lib/whatsapp/gupshup";
import { sendViaTwilio } from "@/lib/whatsapp/twilio";

/**
 * WhatsApp BSP adapter layer (Item 4 — outbound lead confirmations).
 *
 * Provider gating mirrors Stripe/Razorpay: with no WHATSAPP_BSP_PROVIDER env
 * set, `isWhatsAppConfigured()` is false and every caller quietly skips the
 * channel — nothing in the existing pipeline changes behavior.
 *
 * Env:
 *   WHATSAPP_BSP_PROVIDER=gupshup | twilio
 *   Gupshup: WHATSAPP_BSP_API_KEY, WHATSAPP_BSP_SOURCE_NUMBER, WHATSAPP_BSP_APP_NAME
 *   Twilio:  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 */

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export function isWhatsAppConfigured(): boolean {
  const provider = process.env.WHATSAPP_BSP_PROVIDER;
  if (provider === "gupshup") {
    return !!process.env.WHATSAPP_BSP_API_KEY && !!process.env.WHATSAPP_BSP_SOURCE_NUMBER;
  }
  if (provider === "twilio") {
    return (
      !!process.env.TWILIO_ACCOUNT_SID &&
      !!process.env.TWILIO_AUTH_TOKEN &&
      !!process.env.TWILIO_WHATSAPP_FROM
    );
  }
  return false;
}

/**
 * Normalize a caller-provided phone into BSP digits (country code, no +).
 * Bare 10-digit numbers default to India (+91) — that's the ICP; callers
 * elsewhere typically say their number with the country code.
 */
export function normalizePhoneForWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export async function sendWhatsAppText(opts: {
  to: string; // raw phone as captured
  text: string;
  from?: string | null;
}): Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) return { ok: false, error: "WhatsApp BSP not configured" };

  const to = normalizePhoneForWhatsApp(opts.to);
  if (!to) return { ok: false, error: `Unusable phone number: ${opts.to}` };

  const provider = process.env.WHATSAPP_BSP_PROVIDER;
  if (provider === "gupshup") return sendViaGupshup({ to, text: opts.text, from: opts.from });
  if (provider === "twilio") return sendViaTwilio({ to, text: opts.text, from: opts.from });
  return { ok: false, error: `Unknown WhatsApp provider: ${provider}` };
}
