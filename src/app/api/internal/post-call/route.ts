import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePostCallAnalysis, generateInterviewReport } from "@/lib/claude";
import { flushTraces } from "@/lib/langsmith";
import type { TranscriptMessage } from "@/types/session";
import type { InterviewSessionData, InterviewCandidateContext } from "@/lib/claude";

/**
 * Internal endpoint: triggers Claude post-call analysis for a session.
 * Called fire-and-forget from session PATCH handlers.
 * For interview sessions: generates a detailed interview report instead.
 */
export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: { agent: { select: { name: true, templateType: true, config: true } } },
    });

    if (!session || !session.transcript) {
      return NextResponse.json({ error: "Session not found or no transcript" }, { status: 404 });
    }

    // Skip if summary already exists (prevent duplicate Claude calls)
    if (session.summary != null) {
      return NextResponse.json({ skipped: true, reason: "already analyzed" });
    }

    const transcript = session.transcript as unknown as TranscriptMessage[];
    if (transcript.length === 0) {
      return NextResponse.json({ skipped: true, reason: "empty transcript" });
    }

    const agentName = session.agent?.name || "AI Agent";
    const isInterview = session.agent?.templateType === "interview";

    console.log(`[PostCall] Analyzing session ${sessionId} (${transcript.length} messages, interview=${isInterview})`);

    if (isInterview) {
      // Interview-specific: generate detailed report
      const interviewData = session.actionItems as unknown as InterviewSessionData | null;
      if (interviewData?.scores) {
        const config = (session.agent?.config as Record<string, unknown>) || {};
        const candidateContext: InterviewCandidateContext = {
          name: session.callerName || undefined,
          techStack: Array.isArray(config.techStack) ? (config.techStack as string[]).join(", ") : String(config.techStack || "General"),
          level: String(config.level || "Mid"),
          targetRole: config.company ? `Role at ${config.company as string}` : undefined,
        };

        const report = await generateInterviewReport(transcript, interviewData, candidateContext);

        // Format report as markdown summary
        const summaryLines: string[] = [];
        summaryLines.push(`**Overall Score: ${report.overallScore}/100 (${report.verdict.replace("_", " ")})**\n`);
        summaryLines.push(report.summary);
        if (report.roundBreakdown.length > 0) {
          summaryLines.push("\n**Round Breakdown:**");
          for (const r of report.roundBreakdown) {
            summaryLines.push(`- ${r.roundName}: ${r.score}/10 — ${r.comments}`);
          }
        }
        if (report.communicationFeedback) summaryLines.push(`\n**Communication:** ${report.communicationFeedback}`);
        if (report.technicalStrengths.length > 0) summaryLines.push(`\n**Strengths:** ${report.technicalStrengths.join(", ")}`);
        if (report.technicalWeaknesses.length > 0) summaryLines.push(`\n**Weaknesses:** ${report.technicalWeaknesses.join(", ")}`);
        if (report.areasToImprove.length > 0) summaryLines.push(`\n**Areas to Improve:** ${report.areasToImprove.join(", ")}`);
        if (report.recommendedResources.length > 0) summaryLines.push(`\n**Resources:** ${report.recommendedResources.join(", ")}`);

        await prisma.agentSession.update({
          where: { id: sessionId },
          data: {
            summary: summaryLines.join("\n"),
            sentiment: report.verdict,
            sentimentScore: report.overallScore / 10,
            topics: ["interview", ...(report.technicalStrengths.length > 0 ? ["technical"] : [])],
          },
        });

        console.log(`[PostCall] Interview report generated: ${report.verdict}, ${report.overallScore}/100`);
        await flushTraces();
        return NextResponse.json({ success: true, report });
      }
      // Fall through to generic analysis if no interview data
    }

    // Generic post-call analysis for non-interview sessions
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
