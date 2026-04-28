import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { triggerPostCallAnalysis } from "@/lib/post-call";
import { recordBusinessSessionUsage } from "@/lib/ratelimit";
import { SessionPatchSchema } from "@/lib/schemas";

function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return request.headers.get("x-session-token");
}

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

    // Require the per-session bearer token issued at creation.
    // Sessions without a token (legacy rows) cannot be updated via this route.
    const provided = extractToken(request);
    if (!session.updateToken || !provided || !tokensMatch(provided, session.updateToken)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Lead captured by the agent's captureLead tool. Stamp capturedAt server-side.
    if (body.capturedLead) {
      updateData.capturedLead = { ...body.capturedLead, capturedAt: new Date().toISOString() };
      // Mirror name/phone/email onto top-level columns so existing dashboards
      // and the post-call analyzer can read them without re-parsing JSON.
      if (body.capturedLead.name) updateData.callerName = body.capturedLead.name;
      if (body.capturedLead.phone) updateData.callerPhone = body.capturedLead.phone;
      if (body.capturedLead.email) updateData.callerEmail = body.capturedLead.email;
    }

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
