import type { WhatsAppSendResult } from "@/lib/whatsapp/index";

/**
 * Gupshup WhatsApp BSP adapter (India-native, cheapest per message).
 * Docs: https://docs.gupshup.io/reference/msg
 *
 * Env: WHATSAPP_BSP_API_KEY, WHATSAPP_BSP_SOURCE_NUMBER (E.164 digits, no +),
 *      WHATSAPP_BSP_APP_NAME.
 */
export async function sendViaGupshup(opts: {
  to: string; // digits only, with country code
  text: string;
  from?: string | null;
}): Promise<WhatsAppSendResult> {
  const apiKey = process.env.WHATSAPP_BSP_API_KEY;
  const source = opts.from || process.env.WHATSAPP_BSP_SOURCE_NUMBER;
  const appName = process.env.WHATSAPP_BSP_APP_NAME;
  if (!apiKey || !source) return { ok: false, error: "Gupshup not configured" };

  const form = new URLSearchParams({
    channel: "whatsapp",
    source,
    destination: opts.to,
    message: JSON.stringify({ type: "text", text: opts.text }),
    ...(appName ? { "src.name": appName } : {}),
  });

  try {
    const res = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: apiKey,
      },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
    if (!res.ok || !data.messageId) {
      return { ok: false, error: data.message || `Gupshup HTTP ${res.status}` };
    }
    return { ok: true, messageId: data.messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gupshup request failed" };
  }
}
