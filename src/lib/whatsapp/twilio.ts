import type { WhatsAppSendResult } from "@/lib/whatsapp/index";

/**
 * Twilio WhatsApp adapter (fallback / non-India).
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (E.164 with +).
 */
export async function sendViaTwilio(opts: {
  to: string; // digits only, with country code
  text: string;
  from?: string | null;
}): Promise<WhatsAppSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = opts.from || process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return { ok: false, error: "Twilio not configured" };

  const form = new URLSearchParams({
    From: `whatsapp:${from.startsWith("+") ? from : `+${from}`}`,
    To: `whatsapp:+${opts.to}`,
    Body: opts.text,
  });

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok || !data.sid) {
      return { ok: false, error: data.message || `Twilio HTTP ${res.status}` };
    }
    return { ok: true, messageId: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Twilio request failed" };
  }
}
