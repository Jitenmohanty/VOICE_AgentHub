import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { r2PutObject, isR2Configured } from "@/lib/storage/r2";
import { authenticateBookingRequest, extractSessionToken } from "@/lib/calendar/booking";

/**
 * POST /api/public/agent/[slug]/recording?sessionId=...
 * Raw body: the finished call recording (audio/webm from MediaRecorder).
 *
 * Auth: per-session bearer token (same as session PATCH / booking). Gated on
 * Business.recordingEnabled + platform R2 config; uploading implies the
 * caller consented on the pre-call screen (the client never records without
 * consent — recordingConsent is stamped true here for the audit trail).
 *
 * 8 MB cap: a 9-minute Opus recording is ~2 MB, so the cap is generous while
 * still refusing junk.
 */

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sessionId = new URL(request.url).searchParams.get("sessionId") || "";
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const auth = await authenticateBookingRequest(slug, sessionId, extractSessionToken(request));
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!isR2Configured()) {
      return NextResponse.json({ error: "Recording storage not configured" }, { status: 503 });
    }
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { recordingEnabled: true },
    });
    if (!business?.recordingEnabled) {
      return NextResponse.json({ error: "Recording not enabled for this business" }, { status: 403 });
    }

    const existing = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      select: { recordingKey: true },
    });
    if (existing?.recordingKey) {
      return NextResponse.json({ ok: true, skipped: "already uploaded" });
    }

    const contentType = request.headers.get("content-type") || "audio/webm";
    if (!contentType.startsWith("audio/")) {
      return NextResponse.json({ error: "Body must be audio" }, { status: 415 });
    }
    const body = Buffer.from(await request.arrayBuffer());
    if (body.length === 0) return NextResponse.json({ error: "Empty body" }, { status: 400 });
    if (body.length > MAX_BYTES) return NextResponse.json({ error: "Recording too large" }, { status: 413 });

    const key = `recordings/${auth.businessId}/${sessionId}.webm`;
    await r2PutObject(key, body, contentType);

    await prisma.agentSession.update({
      where: { id: sessionId },
      data: { recordingKey: key, recordingConsent: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[recording upload] failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
