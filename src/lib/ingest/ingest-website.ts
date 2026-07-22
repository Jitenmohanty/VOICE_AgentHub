import { prisma } from "@/lib/db";
import { chunkDocument } from "@/lib/claude";
import { enqueueEmbeddings } from "@/lib/embeddings-queue";
import { crawlSite, type CrawledPage } from "@/lib/ingest/crawl";

/**
 * Website → knowledge base ingestion core (Item 1).
 *
 * crawl (same-origin, ≤8 pages) → Claude chunking → KnowledgeItem rows
 * (sourceType "URL", metadata.sourceUrl) → async pgvector embeddings.
 *
 * Called from the Inngest function `knowledge/ingest-website` in production,
 * or fire-and-forget from the API route when Inngest isn't configured (dev).
 * Progress is visible to the owner through the knowledge list itself — items
 * appear with embeddingStatus pending → ready, exactly like manual adds.
 */

const MAX_ITEMS_PER_INGEST = 40;

export interface IngestResult {
  pagesCrawled: number;
  itemsCreated: number;
  skippedDuplicates: number;
}

/** Fallback chunker when Claude is unavailable: split on blank lines into ~1200-char blocks. */
function naiveChunk(page: CrawledPage): { title: string; content: string }[] {
  const chunks: { title: string; content: string }[] = [];
  let buffer = "";
  for (const para of page.text.split(/\n{2,}/)) {
    if ((buffer + para).length > 1200 && buffer.length > 0) {
      chunks.push({ title: `${page.title} (part ${chunks.length + 1})`, content: buffer.trim() });
      buffer = "";
    }
    buffer += para + "\n\n";
  }
  if (buffer.trim().length > 0) {
    chunks.push({
      title: chunks.length === 0 ? page.title : `${page.title} (part ${chunks.length + 1})`,
      content: buffer.trim(),
    });
  }
  return chunks;
}

async function chunkPage(page: CrawledPage): Promise<{ title: string; content: string }[]> {
  if (!process.env.ANTHROPIC_API_KEY) return naiveChunk(page);
  try {
    const sections = await chunkDocument(page.text);
    return sections.length > 0 ? sections : naiveChunk(page);
  } catch {
    return naiveChunk(page);
  }
}

export async function ingestWebsiteForAgent(agentId: string, url: string): Promise<IngestResult> {
  const pages = await crawlSite(url);

  // Existing URL-sourced titles for this agent — re-running an import on the
  // same site updates nothing and creates no duplicates.
  const existing = await prisma.knowledgeItem.findMany({
    where: { agentId, sourceType: "URL" },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((e) => e.title.toLowerCase()));

  let itemsCreated = 0;
  let skippedDuplicates = 0;
  const toEmbed: { itemId: string; text: string }[] = [];

  for (const page of pages) {
    if (itemsCreated >= MAX_ITEMS_PER_INGEST) break;
    const sections = await chunkPage(page);

    for (const section of sections) {
      if (itemsCreated >= MAX_ITEMS_PER_INGEST) break;
      const title = section.title.trim().slice(0, 200);
      const content = section.content.trim();
      if (!title || content.length < 40) continue;
      if (existingTitles.has(title.toLowerCase())) {
        skippedDuplicates++;
        continue;
      }

      const item = await prisma.knowledgeItem.create({
        data: {
          agentId,
          title,
          content: content.slice(0, 8000),
          category: "general",
          sourceType: "URL",
          metadata: { sourceUrl: page.url, importedFrom: url },
          embeddingStatus: "pending",
        },
      });
      existingTitles.add(title.toLowerCase());
      itemsCreated++;
      toEmbed.push({ itemId: item.id, text: `${title}: ${content}` });
    }
  }

  // Durable, retried embedding via Inngest — fanned out after the crawl so a
  // returning serverless response can't strand items in "pending".
  await enqueueEmbeddings(toEmbed);

  console.log(
    `[Ingest] ${url} → ${pages.length} pages, ${itemsCreated} items created, ${skippedDuplicates} duplicates skipped (agent ${agentId})`,
  );
  return { pagesCrawled: pages.length, itemsCreated, skippedDuplicates };
}
