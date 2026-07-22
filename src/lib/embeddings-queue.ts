import { inngest } from "@/inngest/client";
import { generateAndStoreEmbedding } from "@/lib/rag";

/**
 * Enqueue durable embedding for one or more knowledge items.
 *
 * Prefers Inngest so the work survives a serverless response returning (the
 * `embed-knowledge` function runs + retries out of band). If the event can't be
 * sent — e.g. the Inngest Dev Server isn't running locally — it falls back to
 * inline fire-and-forget, which is strictly no worse than the previous
 * behavior and still records `ready`/`failed` on the row.
 */
export async function enqueueEmbedding(itemId: string, text: string): Promise<void> {
  return enqueueEmbeddings([{ itemId, text }]);
}

export async function enqueueEmbeddings(
  items: { itemId: string; text: string }[],
): Promise<void> {
  if (items.length === 0) return;
  try {
    await inngest.send(
      items.map((i) => ({ name: "knowledge/embed-item" as const, data: i })),
    );
  } catch (err) {
    console.warn(
      "[Knowledge] Inngest enqueue failed — embedding inline as fallback:",
      err instanceof Error ? err.message : err,
    );
    for (const i of items) {
      void generateAndStoreEmbedding(i.itemId, i.text).catch(() => {});
    }
  }
}
