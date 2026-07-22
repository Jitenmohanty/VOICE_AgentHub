import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { enqueueEmbeddings } from "@/lib/embeddings-queue";

/**
 * Self-healing backfill for embeddings that never completed.
 *
 * An item can be left in `pending` (e.g. a fire-and-forget fallback was killed,
 * or an event was dropped) or `failed` (transient embedding-API error, missing
 * key at add-time). This cron sweeps those rows and re-enqueues them so the
 * knowledge base becomes searchable without anyone editing the item by hand.
 *
 * The `STALE_MINUTES` cutoff avoids racing items that are legitimately still
 * being embedded right now; healthy items flip to `ready` (bumping updatedAt)
 * and drop out of the query on the next run.
 */
const STALE_MINUTES = 5;
const BATCH = 50;

export const embedBackfill = inngest.createFunction(
  {
    id: "embed-backfill",
    name: "Backfill Stuck Knowledge Embeddings",
    retries: 1,
    triggers: [{ cron: "*/15 * * * *" }], // every 15 minutes
  },
  async ({ step }: { step: import("inngest").GetStepTools<typeof inngest> }) => {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);

    const stuck = await step.run("find-stuck-items", () =>
      prisma.knowledgeItem.findMany({
        where: {
          isActive: true,
          embeddingStatus: { in: ["pending", "failed"] },
          updatedAt: { lt: cutoff },
        },
        select: { id: true, title: true, content: true },
        take: BATCH,
        orderBy: { updatedAt: "asc" },
      }),
    );

    if (stuck.length === 0) return { requeued: 0 };

    await step.run("requeue-embeddings", () =>
      enqueueEmbeddings(stuck.map((i) => ({ itemId: i.id, text: `${i.title}: ${i.content}` }))),
    );

    return { requeued: stuck.length };
  },
);
