import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { traceable } from "langsmith/traceable";

interface KnowledgeResult {
  title: string;
  content: string;
  category: string;
  score: number;
}

/**
 * Store an embedding for a knowledge item using raw SQL (pgvector).
 */
export async function storeEmbedding(
  itemId: string,
  embedding: number[],
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "KnowledgeItem" SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    itemId,
  );
}

/**
 * Query the knowledge base using cosine similarity search.
 * Returns the top-k most relevant items for the given query.
 */
export const queryKnowledge = traceable(
  async function queryKnowledge(
  agentId: string,
  query: string,
  limit: number = 5,
  threshold: number = 0.3,
): Promise<KnowledgeResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Cosine distance: lower = more similar. 1 - distance = similarity score.
  const results = await prisma.$queryRawUnsafe<
    { title: string; content: string; category: string; distance: number }[]
  >(
    `SELECT title, content, category, embedding <=> $1::vector AS distance
     FROM "KnowledgeItem"
     WHERE "agentId" = $2
       AND "isActive" = true
       AND embedding IS NOT NULL
     ORDER BY distance ASC
     LIMIT $3`,
    vectorStr,
    agentId,
    limit,
  );

  return results
    .filter((r) => r.distance < (1 - threshold)) // Convert threshold to distance
    .map((r) => ({
      title: r.title,
      content: r.content,
      category: r.category,
      score: 1 - r.distance, // Convert distance to similarity
    }));
  },
  { name: "queryKnowledge", run_type: "retriever" },
);

/**
 * Build a context string from RAG results to inject into the system prompt.
 */
export function buildRAGContext(results: KnowledgeResult[]): string {
  if (results.length === 0) return "";

  const sections = results.map(
    (r) => `[${r.category.toUpperCase()}] ${r.title}:\n${r.content}`,
  );

  return `\n\n--- BUSINESS KNOWLEDGE ---\nUse the following information to answer customer questions accurately:\n\n${sections.join("\n\n")}`;
}

/**
 * Build a context string from structured business data.
 */
export function buildBusinessDataContext(
  data: { dataType: string; data: unknown }[],
): string {
  if (data.length === 0) return "";

  const sections = data.map((d) => {
    const formatted =
      typeof d.data === "string"
        ? d.data
        : JSON.stringify(d.data, null, 2);
    return `[${d.dataType.replace(/_/g, " ").toUpperCase()}]:\n${formatted}`;
  });

  return `\n\n--- BUSINESS DATA ---\nRefer to this data when helping customers:\n\n${sections.join("\n\n")}`;
}
