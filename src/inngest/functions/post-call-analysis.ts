import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { generatePostCallAnalysis, generateInterviewReport } from "@/lib/claude";
import { flushTraces } from "@/lib/langsmith";
import { deliverLead } from "@/lib/lead-delivery";
import type { TranscriptMessage } from "@/types/session";
import type { InterviewSessionData, InterviewCandidateContext } from "@/lib/claude";

/**
 * Durable post-call analysis job.
 * Triggered by inngest.send({ name: "session/post-call", data: { sessionId } }).
 * Automatically retried up to 3 times on failure (Claude timeout, Neon cold start, etc.).
 */
export const postCallAnalysis = inngest.createFunction(
  {
    id: "post-call-analysis",
    name: "Post-Call Analysis",
    retries: 3,
    // Throttle: max 10 concurrent runs to avoid hammering Claude
    concurrency: { limit: 10 },
    triggers: [{ event: "session/post-call" as const }],
  },
  async ({ event, step }: { event: { data: { sessionId: string } }; step: import("inngest").GetStepTools<typeof inngest> }) => {
    const { sessionId } = event.data;

    // Step 1: fetch session from DB
    const session = await step.run("fetch-session", async () => {
      return prisma.agentSession.findUnique({
        where: { id: sessionId },
        include: { agent: { select: { name: true, templateType: true, config: true } } },
      });
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.summary != null) {
      return { skipped: true, reason: "already analyzed" };
    }

    const transcript = session.transcript as unknown as TranscriptMessage[];
    if (!transcript || transcript.length === 0) {
      return { skipped: true, reason: "empty transcript" };
    }

    const agentName = session.agent?.name || "AI Agent";
    const isInterview = session.agent?.templateType === "interview";

    if (isInterview) {
      const interviewData = session.actionItems as unknown as InterviewSessionData | null;

      if (interviewData?.scores) {
        // Step 2a: generate interview report via Claude
        const report = await step.run("generate-interview-report", async () => {
          const config = (session.agent?.config as Record<string, unknown>) || {};
          const candidateContext: InterviewCandidateContext = {
            name: session.callerName || undefined,
            techStack: Array.isArray(config.techStack)
              ? (config.techStack as string[]).join(", ")
              : String(config.techStack || "General"),
            level: String(config.level || "Mid"),
            targetRole: config.company ? `Role at ${config.company as string}` : undefined,
          };
          return generateInterviewReport(transcript, interviewData, candidateContext);
        });

        // Step 3a: write report to DB
        await step.run("save-interview-report", async () => {
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
        });

        await flushTraces();
        return { success: true, type: "interview", verdict: report.verdict, score: report.overallScore };
      }
      // Fall through to generic if no scores recorded
    }

    // Step 2b: generic post-call analysis
    const analysis = await step.run("generate-analysis", () =>
      generatePostCallAnalysis(agentName, transcript),
    );

    // Step 3b: write to DB
    await step.run("save-analysis", async () => {
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
    });

    // Step 4b: deliver lead notification to the business owner.
    // Runs AFTER analysis so the email includes the summary.
    // Idempotent via leadDeliveredAt — Inngest retries are safe.
    const deliveryResult = await step.run("deliver-lead-email", () => deliverLead(sessionId));

    await flushTraces();
    return {
      success: true,
      type: "generic",
      sentiment: analysis.sentiment,
      leadDelivery: deliveryResult,
    };
  },
);
