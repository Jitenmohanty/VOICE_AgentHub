import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";
import { inngest } from "@/inngest/client";
import { isSafePublicUrl } from "@/lib/ingest/crawl";
import { ingestWebsiteForAgent } from "@/lib/ingest/ingest-website";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

const BodySchema = z.object({
  url: z.string().min(4).max(2000),
});

/**
 * POST /api/business/[businessId]/agents/[agentId]/knowledge/ingest-url
 *
 * Owner/member. Kicks off "import my website into the knowledge base":
 * crawl (same-origin, ≤8 pages) → Claude chunking → KnowledgeItems + embeddings.
 *
 * Runs via Inngest when available (durable, retried); falls back to an inline
 * fire-and-forget run in dev. Either way this returns 202 immediately — the
 * owner watches items appear in the knowledge list with pending → ready
 * embedding status, same as manual adds.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, businessId, business: businessAccessFilter(session.user.id) },
      select: { id: true },
    });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const parse = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: "A valid url is required" }, { status: 400 });
    }
    // Be forgiving about the owner pasting "mybusiness.com" without a scheme.
    const raw = parse.data.url.trim();
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    const safe = isSafePublicUrl(candidate);
    if (!safe.ok) {
      return NextResponse.json({ error: safe.reason }, { status: 400 });
    }
    const url = safe.url.toString();

    try {
      await inngest.send({ name: "knowledge/ingest-website", data: { agentId, url } });
    } catch (err) {
      console.warn("[Ingest] Inngest send failed, running inline:", err);
      // Fire-and-forget — failures show up as missing items; the owner can retry.
      void ingestWebsiteForAgent(agentId, url).catch((e) =>
        console.error("[Ingest] Inline ingest failed:", e),
      );
    }

    return NextResponse.json({ queued: true, url }, { status: 202 });
  } catch (err) {
    console.error("[Ingest] request failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
