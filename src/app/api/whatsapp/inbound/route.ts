import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { handleInboundWhatsAppMessage } from "@/lib/whatsapp/text-agent";
import { flushTraces } from "@/lib/langsmith";

/**
 * POST /api/whatsapp/inbound?token=$WHATSAPP_INBOUND_TOKEN
 *
 * BSP webhook for inbound WhatsApp messages (Gupshup JSON or Twilio
 * form-encoded — auto-detected). Configure this URL in the BSP dashboard
 * with the token query param.
 *
 * Auth: shared secret in the `token` query param, constant-time compared
 * against WHATSAPP_INBOUND_TOKEN. Fails closed when the env is unset —
 * same posture as INTERNAL_API_SECRET.
 *
 * Always returns 200 for parseable-but-ignorable events (status updates,
 * media messages) so the BSP doesn't retry-storm us.
 */

function tokenOk(request: Request): boolean {
  const expected = process.env.WHATSAPP_INBOUND_TOKEN;
  if (!expected) return false;
  const provided = new URL(request.url).searchParams.get("token") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface InboundText {
  from: string;
  text: string;
  destination: string | null;
}

/** Gupshup inbound shape: { type: "message", payload: { type: "text", payload: { text }, sender: { phone }, destination } } */
function parseGupshup(body: unknown): InboundText | null {
  const b = body as {
    type?: string;
    payload?: {
      type?: string;
      payload?: { text?: string };
      sender?: { phone?: string };
      destination?: string;
    };
  };
  if (b?.type !== "message" || b.payload?.type !== "text") return null;
  const from = b.payload.sender?.phone?.replace(/\D/g, "");
  const text = b.payload.payload?.text?.trim();
  if (!from || !text) return null;
  return { from, text, destination: b.payload.destination ?? null };
}

/** Twilio inbound shape (form-encoded): From=whatsapp:+91..., To=whatsapp:+1..., Body=... */
function parseTwilio(form: URLSearchParams): InboundText | null {
  const from = form.get("From")?.replace(/\D/g, "");
  const text = form.get("Body")?.trim();
  if (!from || !text) return null;
  return { from, text, destination: form.get("To")?.replace(/\D/g, "") ?? null };
}

export async function POST(request: Request) {
  if (!process.env.WHATSAPP_INBOUND_TOKEN) {
    console.error("[WhatsApp inbound] WHATSAPP_INBOUND_TOKEN is not set — refusing request");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  if (!tokenOk(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let inbound: InboundText | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      inbound = parseTwilio(new URLSearchParams(await request.text()));
    } else {
      inbound = parseGupshup(await request.json().catch(() => null));
    }

    // Status callbacks, media, reactions, unknown shapes: acknowledge and move on.
    if (!inbound) return NextResponse.json({ ignored: true });

    const result = await handleInboundWhatsAppMessage(inbound);
    await flushTraces();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[WhatsApp inbound] failed:", err);
    await flushTraces();
    // 200 on internal errors too — BSP retries won't fix a code bug, and
    // retry storms make it worse. The error is in logs/Sentry.
    return NextResponse.json({ handled: false, error: "internal" });
  }
}
