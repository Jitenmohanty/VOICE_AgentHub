import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { generateWeeklyDigest } from "@/lib/claude";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { flushTraces } from "@/lib/langsmith";
import { getAppUrl } from "@/lib/url";

/**
 * Weekly owner digest (Item 2). Runs Monday 09:00 IST.
 *
 * For every business that had at least one call in the last 7 days:
 * aggregate the week (calls, leads, hot leads, won, topics), pull the top
 * open knowledge gaps, have Claude write a 2-4 sentence narrative + "add
 * this FAQ next" advice, and email it to the owner.
 *
 * Each business is its own step — if the run fails halfway and Inngest
 * retries, completed steps are memoized so no owner gets the email twice.
 */
export const weeklyDigest = inngest.createFunction(
  {
    id: "weekly-digest",
    name: "Weekly Owner Digest",
    retries: 2,
    triggers: [{ cron: "TZ=Asia/Kolkata 0 9 * * 1" as const }],
  },
  async ({ step }: { step: import("inngest").GetStepTools<typeof inngest> }) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const businesses = await step.run("find-active-businesses", async () => {
      return prisma.business.findMany({
        where: {
          agents: { some: { agentSessions: { some: { createdAt: { gte: since } } } } },
        },
        select: {
          id: true,
          name: true,
          notificationEmail: true,
          owner: { select: { email: true } },
          agents: { select: { id: true } },
        },
        take: 200,
      });
    });

    let sent = 0;
    for (const business of businesses) {
      const result = await step.run(`digest-${business.id}`, async () => {
        const recipient = business.notificationEmail || business.owner?.email;
        if (!recipient) return { sent: false, reason: "no recipient" };

        const agentIds = business.agents.map((a) => a.id);
        if (agentIds.length === 0) return { sent: false, reason: "no agents" };

        const sessions = await prisma.agentSession.findMany({
          where: { agentId: { in: agentIds }, createdAt: { gte: since } },
          select: {
            status: true,
            duration: true,
            capturedLead: true,
            leadStatus: true,
            leadScore: true,
            topics: true,
          },
        });
        if (sessions.length === 0) return { sent: false, reason: "no sessions" };

        const completed = sessions.filter((s) => s.status === "completed");
        const leads = sessions.filter((s) => s.capturedLead != null);
        const durations = sessions.map((s) => s.duration ?? 0).filter((d) => d > 0);
        const topicCounts = new Map<string, number>();
        for (const s of sessions) {
          for (const t of s.topics ?? []) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
        }
        const topTopics = [...topicCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([t]) => t);

        const gaps = await prisma.knowledgeGap.findMany({
          where: { agentId: { in: agentIds }, status: "open" },
          orderBy: [{ hits: "desc" }, { lastAskedAt: "desc" }],
          take: 5,
          select: { query: true, hits: true },
        });

        const stats = {
          businessName: business.name,
          totalCalls: sessions.length,
          completedCalls: completed.length,
          leadsCaptured: leads.length,
          wonLeads: sessions.filter((s) => s.leadStatus === "won").length,
          avgDurationSeconds:
            durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
          topTopics,
          hotLeadCount: sessions.filter((s) => (s.leadScore ?? 0) >= 70).length,
          gaps,
        };

        const digest = await generateWeeklyDigest(stats);

        const appUrl = getAppUrl();
        const firstAgentId = agentIds[0]!;
        const { error } = await sendWeeklyDigestEmail({
          to: recipient,
          businessName: business.name,
          narrative: digest.narrative,
          gapAdvice: digest.gapAdvice,
          stats: {
            totalCalls: stats.totalCalls,
            leadsCaptured: stats.leadsCaptured,
            hotLeadCount: stats.hotLeadCount,
            wonLeads: stats.wonLeads,
          },
          gaps,
          knowledgeUrl: `${appUrl}/business/agents/${firstAgentId}/knowledge?bid=${business.id}`,
          leadsUrl: `${appUrl}/business/leads`,
        });
        if (error) return { sent: false, reason: error.message };
        return { sent: true };
      });
      if (result.sent) sent++;
    }

    await flushTraces();
    return { success: true, businesses: businesses.length, emailsSent: sent };
  },
);
