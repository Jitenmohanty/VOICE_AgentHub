import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

const ALLOWED_LEAD_STATUS = new Set(["new", "contacted", "qualified", "won", "lost", "archived"]);
const ALLOWED_INTENT_CATEGORY = new Set(["booking", "pricing", "support", "complaint", "information", "spam", "other"]);

/**
 * GET /api/business/[businessId]/leads
 *
 * Owner-only. Returns sessions that have a captured lead, optionally filtered
 * by leadStatus and/or agentId, with pagination + per-status counts.
 *
 * Query params:
 *   - status: leadStatus filter (one of ALLOWED_LEAD_STATUS) — omit for all
 *   - agentId: scope to one agent
 *   - search: case-insensitive caller-name / phone / email / intent match
 *   - intent: AI intentCategory filter (booking/pricing/support/complaint/information/spam/other)
 *   - sort: "recent" (default, newest first) | "score" (AI leadScore desc, unscored last)
 *   - page (default 1) / limit (default 20, max 100)
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

    const owns = await prisma.business.findFirst({
      where: { id: businessId, ...businessAccessFilter(session.user.id) },
      select: { id: true },
    });
    if (!owns) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const agentIdParam = url.searchParams.get("agentId");
    const searchParam = url.searchParams.get("search")?.trim() || "";
    const intentParam = url.searchParams.get("intent");
    const sortParam = url.searchParams.get("sort");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.AgentSessionWhereInput = {
      agent: { businessId, ...(agentIdParam ? { id: agentIdParam } : {}) },
      capturedLead: { not: Prisma.DbNull },
    };

    const where: Prisma.AgentSessionWhereInput = {
      ...baseWhere,
      ...(statusParam && ALLOWED_LEAD_STATUS.has(statusParam) ? { leadStatus: statusParam } : {}),
      ...(intentParam && ALLOWED_INTENT_CATEGORY.has(intentParam) ? { intentCategory: intentParam } : {}),
      ...(searchParam
        ? {
            OR: [
              { callerName: { contains: searchParam, mode: "insensitive" } },
              { callerPhone: { contains: searchParam } },
              { callerEmail: { contains: searchParam, mode: "insensitive" } },
              { summary: { contains: searchParam, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    // "score" surfaces the hottest AI-scored leads first; unscored (older,
    // pre-scoring) rows sink to the bottom instead of disappearing.
    const orderBy: Prisma.AgentSessionOrderByWithRelationInput[] =
      sortParam === "score"
        ? [{ leadScore: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

    const [leads, total, statusGroups] = await Promise.all([
      prisma.agentSession.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          agent: { select: { id: true, name: true, templateType: true } },
        },
      }),
      prisma.agentSession.count({ where }),
      // Per-status counts across the whole business (ignores status/search filter
      // so the tab badges always reflect the full universe).
      prisma.agentSession.groupBy({
        by: ["leadStatus"],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const counts: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      won: 0,
      lost: 0,
      archived: 0,
    };
    let allCount = 0;
    for (const row of statusGroups) {
      counts[row.leadStatus] = row._count._all;
      allCount += row._count._all;
    }

    return NextResponse.json({
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      counts: { all: allCount, ...counts },
    });
  } catch (err) {
    console.error("[Leads API] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
