import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePostCallAnalysis } from "@/lib/claude";
import { flushTraces } from "@/lib/langsmith";
import type { TranscriptMessage } from "@/types/session";

/**
 * Internal endpoint: triggers Claude post-call analysis for a session.
 * Called fire-and-forget from session PATCH handlers.
 */
export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: { agent: { select: { name: true } } },
    });

    if (!session || !session.transcript) {
      return NextResponse.json({ error: "Session not found or no transcript" }, { status: 404 });
    }

    // Skip if already analyzed (prevent duplicate Claude calls)
    if (session.sentiment != null) {
      return NextResponse.json({ skipped: true, reason: "already analyzed" });
    }

    const transcript = session.transcript as unknown as TranscriptMessage[];
    if (transcript.length === 0) {
      return NextResponse.json({ skipped: true, reason: "empty transcript" });
    }

    const agentName = session.agent?.name || "AI Agent";

    console.log(`[PostCall] Analyzing session ${sessionId} (${transcript.length} messages)`);

    const analysis = await generatePostCallAnalysis(agentName, transcript);

    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        summary: analysis.summary,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        actionItems: JSON.parse(JSON.stringify(analysis.actionItems)),
        topics: analysis.topics,
        escalated: analysis.escalated,
      },
    });

    console.log(`[PostCall] Session ${sessionId} analyzed: ${analysis.sentiment}, ${analysis.topics.length} topics`);

    await flushTraces();
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("[PostCall] Analysis failed:", error);
    await flushTraces();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
