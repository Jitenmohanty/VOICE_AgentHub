import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

interface Daily {
  date: string; // YYYY-MM-DD in UTC
  calls: number;
  leads: number;
}

/**
 * GET /api/business/[businessId]/analytics?days=30
 *
 * Aggregates AgentSession rows for the business into the numbers the
 * Analytics page renders. Cheap-ish — one indexed range query per metric.
 * Cap on `days` is 365 to keep the daily series bounded.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { businessId } = await params;

    const accessible = await prisma.business.findFirst({
      where: { id: businessId, ...businessAccessFilter(session.user.id) },
      select: { id: true },
    });
    if (!accessible) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const days = Math.min(365, Math.max(7, parseInt(url.searchParams.get("days") || "30", 10)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const baseWhere = {
      agent: { businessId },
      createdAt: { gte: since },
    } as const;

    // Pull a slim projection of everything in-window — fewer round-trips than
    // a dozen separate counts and easy to slice in JS.
    const sessions = await prisma.agentSession.findMany({
      where: baseWhere,
      select: {
        id: true,
        createdAt: true,
        duration: true,
        status: true,
        sentiment: true,
        topics: true,
        escalated: true,
        capturedLead: true,
        leadStatus: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const totalCalls = sessions.length;
    let completedCalls = 0;
    let leadsCaptured = 0;
    let wonLeads = 0;
    let escalatedCount = 0;
    let durationSum = 0;
    let durationCount = 0;

    const sentimentBreakdown: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
      mixed: 0,
    };

    const topicCounts = new Map<string, number>();
    const hourCounts = new Array(24).fill(0) as number[];

    const dailyMap = new Map<string, Daily>();
    // Pre-seed every day in the window so the chart doesn't have gaps.
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, calls: 0, leads: 0 });
    }

    for (const s of sessions) {
      const day = s.createdAt.toISOString().slice(0, 10);
      const slot = dailyMap.get(day);
      if (slot) slot.calls += 1;

      const h = s.createdAt.getUTCHours();
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;

      if (s.status === "completed") completedCalls += 1;
      if (s.escalated) escalatedCount += 1;

      if (typeof s.duration === "number" && s.duration > 0) {
        durationSum += s.duration;
        durationCount += 1;
      }

      if (s.sentiment && sentimentBreakdown[s.sentiment] !== undefined) {
        sentimentBreakdown[s.sentiment] = (sentimentBreakdown[s.sentiment] ?? 0) + 1;
      }

      for (const t of s.topics || []) {
        topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
      }

      // capturedLead is JSON?; Prisma serializes DB NULL as `null`, JSON literal
      // null is also `null` — both mean "no lead".
      const lead = s.capturedLead as unknown;
      if (lead && lead !== Prisma.DbNull) {
        leadsCaptured += 1;
        if (slot) slot.leads += 1;
        if (s.leadStatus === "won") wonLeads += 1;
      }
    }

    const daily = Array.from(dailyMap.values());
    const conversionRate = completedCalls > 0 ? leadsCaptured / completedCalls : 0;
    const wonRate = leadsCaptured > 0 ? wonLeads / leadsCaptured : 0;
    const avgDurationSeconds = durationCount > 0 ? Math.round(durationSum / durationCount) : 0;

    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic, count]) => ({ topic, count }));

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return NextResponse.json({
      windowDays: days,
      totalCalls,
      completedCalls,
      leadsCaptured,
      wonLeads,
      conversionRate,
      wonRate,
      escalatedCount,
      avgDurationSeconds,
      sentimentBreakdown,
      topTopics,
      hourCounts,
      peakHour,
      daily,
    });
  } catch (err) {
    console.error("[Analytics] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
