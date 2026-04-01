import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateInterviewReport } from "@/lib/claude";
import { flushTraces } from "@/lib/langsmith";
import type { TranscriptMessage } from "@/types/session";
import type { InterviewSessionData, InterviewCandidateContext } from "@/lib/claude";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/sessions/[id]/report
 * Generate a detailed interview report via Claude.
 * Requires authentication (business owner).
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const agentSession = await prisma.agentSession.findFirst({
      where: {
        id,
        agent: { business: { ownerId: session.user.id } },
      },
      include: {
        agent: { select: { name: true, templateType: true, config: true } },
      },
    });

    if (!agentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (agentSession.agent?.templateType !== "interview") {
      return NextResponse.json({ error: "Report generation is only available for interview sessions" }, { status: 400 });
    }

    const transcript = (agentSession.transcript as unknown as TranscriptMessage[]) || [];
    if (transcript.length === 0) {
      return NextResponse.json({ error: "No transcript available" }, { status: 400 });
    }

    // Extract interview data from actionItems
    const interviewData = agentSession.actionItems as unknown as InterviewSessionData | null;
    if (!interviewData?.scores) {
      return NextResponse.json({ error: "No interview scoring data found" }, { status: 400 });
    }

    // Build candidate context from session + agent config
    const config = (agentSession.agent?.config as Record<string, unknown>) || {};
    const candidateContext: InterviewCandidateContext = {
      name: agentSession.callerName || undefined,
      techStack: Array.isArray(config.techStack) ? (config.techStack as string[]).join(", ") : String(config.techStack || "General"),
      level: String(config.level || "Mid"),
      targetRole: config.company ? `Role at ${config.company as string}` : undefined,
    };

    const report = await generateInterviewReport(transcript, interviewData, candidateContext);

    // Save report as summary + update sentiment with the interview verdict
    await prisma.agentSession.update({
      where: { id },
      data: {
        summary: formatReportMarkdown(report),
        sentiment: report.verdict,
        sentimentScore: report.overallScore / 10, // Normalize 0-100 to 0-10
      },
    });

    await flushTraces();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[InterviewReport] Generation failed:", error);
    await flushTraces();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report generation failed" },
      { status: 500 },
    );
  }
}

/** GET — retrieve the existing report for a session */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const agentSession = await prisma.agentSession.findFirst({
      where: {
        id,
        agent: { business: { ownerId: session.user.id } },
      },
      select: { summary: true, sentiment: true, sentimentScore: true, actionItems: true },
    });

    if (!agentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      report: agentSession.summary,
      verdict: agentSession.sentiment,
      score: agentSession.sentimentScore,
      interviewData: agentSession.actionItems,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatReportMarkdown(report: {
  overallScore: number;
  verdict: string;
  summary: string;
  roundBreakdown: { round: number; roundName: string; score: number; comments: string }[];
  communicationFeedback: string;
  technicalStrengths: string[];
  technicalWeaknesses: string[];
  areasToImprove: string[];
  recommendedResources: string[];
}): string {
  const lines: string[] = [];
  lines.push(`**Overall Score: ${report.overallScore}/100 (${report.verdict.replace("_", " ")})**`);
  lines.push("");
  lines.push(report.summary);
  lines.push("");

  if (report.roundBreakdown.length > 0) {
    lines.push("**Round Breakdown:**");
    for (const r of report.roundBreakdown) {
      lines.push(`- Round ${r.round} (${r.roundName}): ${r.score}/10 — ${r.comments}`);
    }
    lines.push("");
  }

  if (report.communicationFeedback) {
    lines.push(`**Communication:** ${report.communicationFeedback}`);
    lines.push("");
  }

  if (report.technicalStrengths.length > 0) {
    lines.push("**Strengths:** " + report.technicalStrengths.join(", "));
  }
  if (report.technicalWeaknesses.length > 0) {
    lines.push("**Weaknesses:** " + report.technicalWeaknesses.join(", "));
  }
  if (report.areasToImprove.length > 0) {
    lines.push("**Areas to Improve:** " + report.areasToImprove.join(", "));
  }
  if (report.recommendedResources.length > 0) {
    lines.push("**Recommended Resources:** " + report.recommendedResources.join(", "));
  }

  return lines.join("\n");
}
