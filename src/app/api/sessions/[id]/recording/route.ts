import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";
import { r2PresignGetUrl, isR2Configured } from "@/lib/storage/r2";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/sessions/[id]/recording — owner or team member.
 * Returns a 15-minute presigned playback URL for the session's recording.
 * The R2 object stays private; this is the only read path.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const agentSession = await prisma.agentSession.findFirst({
      where: { id, agent: { business: businessAccessFilter(session.user.id) } },
      select: { recordingKey: true },
    });
    if (!agentSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (!agentSession.recordingKey) {
      return NextResponse.json({ error: "No recording for this session" }, { status: 404 });
    }
    if (!isR2Configured()) {
      return NextResponse.json({ error: "Recording storage not configured" }, { status: 503 });
    }

    return NextResponse.json({
      url: r2PresignGetUrl(agentSession.recordingKey, 900),
      expiresInSeconds: 900,
    });
  } catch (err) {
    console.error("[recording playback] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
