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

    // Build update data
    const updateData: Record<string, unknown> = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.transcript !== undefined && { transcript: body.transcript }),
      ...(body.summary !== undefined && { summary: body.summary }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.rating !== undefined && { rating: body.rating }),
      ...(body.feedback !== undefined && { feedback: body.feedback }),
      ...(body.status !== undefined && { status: body.status }),
    };

    // Persist interview scoring data in actionItems if provided
    if (body.interviewData) {
      updateData.actionItems = body.interviewData;
      // Calculate overall sentiment from interview result
      if (body.interviewData.result?.overallImpression) {
        const impression = body.interviewData.result.overallImpression;
        updateData.sentiment = impression; // "strong" / "average" / "needs_work"
        // Compute average score from all scoreAnswer calls
        const scores = body.interviewData.scores as { score: number }[] | undefined;
        if (scores && scores.length > 0) {
          const avg = scores.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / scores.length;
          updateData.sentimentScore = Math.round(avg * 10) / 10; // 1-10 scale
        }
      }
    }

    const updated = await prisma.agentSession.update({
      where: { id: sessionId },
      data: updateData,
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
