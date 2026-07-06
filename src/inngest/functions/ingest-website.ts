import { inngest } from "@/inngest/client";
import { ingestWebsiteForAgent } from "@/lib/ingest/ingest-website";

/**
 * Durable website → knowledge ingestion (Item 1).
 * Triggered by inngest.send({ name: "knowledge/ingest-website", data: { agentId, url } }).
 *
 * The whole ingest runs as one step: it's idempotent by design (duplicate
 * titles are skipped on re-run), so an Inngest retry after a partial failure
 * picks up where the last run left off without double-creating items.
 */
export const ingestWebsite = inngest.createFunction(
  {
    id: "ingest-website",
    name: "Ingest Website into Knowledge Base",
    retries: 2,
    concurrency: { limit: 3 },
    triggers: [{ event: "knowledge/ingest-website" as const }],
  },
  async ({ event, step }: { event: { data: { agentId: string; url: string } }; step: import("inngest").GetStepTools<typeof inngest> }) => {
    const { agentId, url } = event.data;

    const result = await step.run("crawl-chunk-embed", () =>
      ingestWebsiteForAgent(agentId, url),
    );

    return { success: true, ...result };
  },
);
