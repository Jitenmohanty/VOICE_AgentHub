import { inngest } from "@/inngest/client";
import { generateAndStoreEmbedding } from "@/lib/rag";

/**
 * Durable embedding of a single knowledge item.
 *
 * Previously every ingestion path fired `void generateAndStoreEmbedding(...)`
 * after the HTTP response returned — on serverless that in-flight promise can be
 * killed once the function freezes, leaving the item stuck `embeddingStatus:
 * "pending"` forever (and therefore invisible to RAG). Routing it through
 * Inngest makes the work durable and retried; `generateAndStoreEmbedding` still
 * records `ready`/`failed` on the row itself, so the dashboard stays accurate.
 */
export const embedKnowledge = inngest.createFunction(
  {
    id: "embed-knowledge",
    name: "Embed Knowledge Item",
    retries: 3,
    // Stay under the embedding API's rate limits when a bulk import fans out.
    concurrency: { limit: 5 },
    triggers: [{ event: "knowledge/embed-item" as const }],
  },
  async ({
    event,
    step,
  }: {
    event: { data: { itemId: string; text: string } };
    step: import("inngest").GetStepTools<typeof inngest>;
  }) => {
    const { itemId, text } = event.data;
    await step.run("generate-and-store-embedding", () =>
      generateAndStoreEmbedding(itemId, text),
    );
    return { itemId, embedded: true };
  },
);
