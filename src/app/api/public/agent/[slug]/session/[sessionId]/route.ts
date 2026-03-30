import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerPostCallAnalysis } from "@/lib/post-call";

/** PATCH — update anonymous session (transcript, rating). No auth. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.transcript !== undefined && { transcript: body.transcript }),
        ...(body.summary !== undefined && { summary: body.summary }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.feedback !== undefined && { feedback: body.feedback }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    // Trigger Claude post-call analysis when session completes
    if (body.status === "completed" && body.transcript) {
      triggerPostCallAnalysis(sessionId);
    }

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
