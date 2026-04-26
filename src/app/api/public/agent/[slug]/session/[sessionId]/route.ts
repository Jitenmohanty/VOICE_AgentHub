import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerPostCallAnalysis } from "@/lib/post-call";
import { recordBusinessSessionUsage } from "@/lib/ratelimit";
import { SessionPatchSchema } from "@/lib/schemas";

/** PATCH — update anonymous session (transcript, rating). No auth. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; sessionId: string }> },
) {
  try {
    const { slug, sessionId } = await params;

    // Validate body
    const rawBody = await request.json().catch(() => ({}));
    const parse = SessionPatchSchema.safeParse(rawBody);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 },
      );
    }
    const body = parse.data;

    // Ownership check: ensure the session belongs to the agent under this slug
    const session = await prisma.agentSession.findFirst({
      where: {
        id: sessionId,
        agent: { business: { slug } },
      },
      include: {
        agent: { select: { businessId: true } },
      },
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
        updateData.sentiment = impression;
        const scores = body.interviewData.scores;
        if (scores && scores.length > 0) {
          const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
          updateData.sentimentScore = Math.round(avg * 10) / 10;
        }
      }
    }

    const updated = await prisma.agentSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Bill the session's elapsed seconds against the business's daily quota.
    // We charge the *delta* so a single session reporting growing duration
    // mid-call doesn't get double-counted.
    if (
      typeof body.duration === "number" &&
      body.duration > (session.duration ?? 0) &&
      session.agent?.businessId
    ) {
      const delta = body.duration - (session.duration ?? 0);
      recordBusinessSessionUsage(session.agent.businessId, delta).catch(
        (err) => console.warn("[Quota] Failed to record usage:", err),
      );
    }

    // Trigger Claude post-call analysis when session completes
    if (body.status === "completed" && body.transcript) {
      triggerPostCallAnalysis(sessionId);
    }

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
