import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";
import { enqueueEmbeddings } from "@/lib/embeddings-queue";
import { parseOkfBundle, conceptToKnowledgeItem, conceptToBusinessData } from "@/lib/okf";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

// Bundle-size guards — bound memory, DB writes, and embedding cost.
const MAX_FILES = 500;
const MAX_TOTAL_BYTES = 5_000_000; // ~5 MB of markdown
const MAX_ITEMS = 300; // knowledge concepts imported per request

/**
 * POST /api/business/[businessId]/agents/[agentId]/knowledge/import/okf
 *
 * Owner/member. Imports an OKF bundle ({ files: { "<path>.md": "<contents>" } })
 * into the agent's knowledge base:
 *   - `type: knowledge` concepts only (BusinessData/agent cards are Phase 3).
 *   - Idempotent: a concept whose `voxie_id` matches an existing item OF THIS
 *     AGENT is updated; otherwise a new item is created. An id that doesn't
 *     belong to this agent is treated as a create — no cross-tenant writes.
 *   - Skip-unchanged: if the content is identical, the embedding is left alone
 *     (no wasted Gemini call, embeddingStatus stays "ready").
 *   - Changed/new content → embeddingStatus="pending" + async re-embed, exactly
 *     like a manual add. RAG retrieval is unchanged.
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

    const body = await request.json().catch(() => null);
    const files: unknown = body?.files;
    if (!files || typeof files !== "object" || Array.isArray(files)) {
      return NextResponse.json({ error: "Expected { files: { path: contents } }" }, { status: 400 });
    }

    const entries = Object.entries(files as Record<string, unknown>);
    if (entries.length > MAX_FILES) {
      return NextResponse.json({ error: `Too many files (max ${MAX_FILES})` }, { status: 400 });
    }
    let totalBytes = 0;
    const clean: Record<string, string> = {};
    for (const [path, contents] of entries) {
      if (typeof contents !== "string") continue;
      totalBytes += contents.length;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json({ error: "Bundle too large" }, { status: 400 });
      }
      clean[path] = contents;
    }

    // Parse once (pure, tested, never throws), then split into knowledge items
    // and structured business data. Agent cards (type: agent) map to neither and
    // are ignored by design — importing config must not silently change behavior.
    const concepts = parseOkfBundle(clean);
    const drafts = concepts
      .map(conceptToKnowledgeItem)
      .filter((d): d is NonNullable<typeof d> => d !== null);
    const dataDrafts = concepts
      .map(conceptToBusinessData)
      .filter((d): d is NonNullable<typeof d> => d !== null);

    if (drafts.length === 0 && dataDrafts.length === 0) {
      return NextResponse.json({ error: "No knowledge or data concepts found in bundle" }, { status: 400 });
    }
    if (drafts.length > MAX_ITEMS) {
      return NextResponse.json({ error: `Too many items (max ${MAX_ITEMS})` }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0; // matched + content unchanged → embedding left intact
    const toEmbed: { id: string; text: string }[] = [];

    // Sequential writes — Neon HTTP adapter has limited $transaction support
    // (see CLAUDE.md), and per-item upsert keeps failures isolated.
    for (const d of drafts) {
      // Only match an existing row that belongs to THIS agent (cross-tenant safe).
      const existing = d.id
        ? await prisma.knowledgeItem.findFirst({
            where: { id: d.id, agentId },
            select: { id: true, content: true },
          })
        : null;

      if (existing) {
        const unchanged = existing.content.trim() === d.content.trim();
        await prisma.knowledgeItem.update({
          where: { id: existing.id },
          data: {
            title: d.title,
            content: d.content,
            category: d.category,
            sourceType: d.sourceType,
            metadata: d.metadata,
            ...(unchanged ? {} : { embeddingStatus: "pending", embeddingError: null }),
          },
        });
        if (unchanged) {
          skipped++;
        } else {
          updated++;
          toEmbed.push({ id: existing.id, text: `${d.title}: ${d.content}` });
        }
      } else {
        const row = await prisma.knowledgeItem.create({
          data: {
            agentId,
            title: d.title,
            content: d.content,
            category: d.category,
            sourceType: d.sourceType,
            metadata: d.metadata,
            embeddingStatus: "pending",
          },
          select: { id: true },
        });
        created++;
        toEmbed.push({ id: row.id, text: `${d.title}: ${d.content}` });
      }
    }

    // Upsert structured BusinessData by the (agentId, dataType) unique key.
    // No embeddings — this data feeds the info tools, not RAG. Safe by design:
    // the where-clause is scoped to the verified agent, so a bundle can't write
    // to another tenant's rows.
    let dataUpserted = 0;
    for (const d of dataDrafts) {
      await prisma.businessData.upsert({
        where: { agentId_dataType: { agentId, dataType: d.dataType } },
        create: { agentId, dataType: d.dataType, data: d.data as object },
        update: { data: d.data as object },
      });
      dataUpserted++;
    }

    // Durable embeddings via Inngest (fanned out, retried); failures land as
    // embeddingStatus="failed" on the row for the dashboard retry button.
    await enqueueEmbeddings(toEmbed.map((e) => ({ itemId: e.id, text: e.text })));

    return NextResponse.json({
      created,
      updated,
      skipped,
      dataUpserted,
      total: drafts.length + dataDrafts.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
