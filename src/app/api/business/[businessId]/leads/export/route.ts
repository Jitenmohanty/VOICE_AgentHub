import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppUrl } from "@/lib/url";

const ALLOWED_LEAD_STATUS = new Set(["new", "contacted", "qualified", "won", "lost", "archived"]);

interface CapturedLeadShape {
  intent?: string;
  urgency?: string;
  notes?: string;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

/**
 * GET /api/business/[businessId]/leads/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=...
 * Owner-only. Streams a CSV of every session that has either a captured lead
 * OR a Claude summary in the requested window. Default window: last 90 days.
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
      where: { id: businessId, ownerId: session.user.id },
      select: { id: true, slug: true },
    });
    if (!owns) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const statusParam = url.searchParams.get("status");

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const from = fromParam && !Number.isNaN(Date.parse(fromParam)) ? new Date(fromParam) : ninetyDaysAgo;
    const to = toParam && !Number.isNaN(Date.parse(toParam))
      ? new Date(new Date(toParam).getTime() + 24 * 60 * 60 * 1000) // inclusive of the "to" day
      : new Date();

    const sessions = await prisma.agentSession.findMany({
      where: {
        agent: { businessId },
        createdAt: { gte: from, lt: to },
        ...(statusParam && ALLOWED_LEAD_STATUS.has(statusParam)
          ? { leadStatus: statusParam }
          : {}),
        // Skip empty/abandoned calls — same gate as lead-delivery email.
        // Json? columns: unset rows are DB NULL, so Prisma.DbNull is the
        // correct sentinel ("the database NULL", not the JSON literal `null`).
        OR: [
          { capturedLead: { not: Prisma.DbNull } },
          { summary: { not: null } },
        ],
      },
      include: { agent: { select: { name: true, templateType: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000, // hard ceiling so a misclick can't tank the server
    });

    const appUrl = getAppUrl();
    const header = csvRow([
      "createdAt",
      "agentName",
      "agentTemplate",
      "callerName",
      "callerPhone",
      "callerEmail",
      "intent",
      "urgency",
      "notes",
      "summary",
      "sentiment",
      "sentimentScore",
      "topics",
      "escalated",
      "leadStatus",
      "durationSeconds",
      "transcriptUrl",
    ]);

    const rows = sessions.map((s) => {
      const lead = (s.capturedLead as unknown as CapturedLeadShape) || null;
      return csvRow([
        s.createdAt.toISOString(),
        s.agent?.name ?? "",
        s.agent?.templateType ?? "",
        s.callerName ?? "",
        s.callerPhone ?? "",
        s.callerEmail ?? "",
        lead?.intent ?? "",
        lead?.urgency ?? "",
        lead?.notes ?? "",
        s.summary ?? "",
        s.sentiment ?? "",
        s.sentimentScore ?? "",
        (s.topics ?? []).join("; "),
        s.escalated ? "yes" : "no",
        s.leadStatus,
        s.duration ?? "",
        `${appUrl}/business/sessions/${s.id}`,
      ]);
    });

    const body = [header, ...rows].join("\n") + "\n";
    const filename = `agenthub-leads-${owns.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Total-Rows": String(rows.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[Leads CSV] failed:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
