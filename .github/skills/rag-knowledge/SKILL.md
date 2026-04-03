---
name: rag-knowledge
description: "Use when adding, updating, or searching knowledge items with RAG in AgentHub. Covers creating KnowledgeItems, generating pgvector embeddings with Gemini text-embedding-004, and cosine similarity search."
---

# RAG Knowledge Items

**When**: Adding knowledge that agents can retrieve during voice calls (FAQs, policies, menus, procedures).

---

## Creating a Knowledge Item with Embedding

```typescript
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

// 1. Create the item (embedding is async — added separately)
const item = await prisma.knowledgeItem.create({
  data: {
    agentId,
    title: "Cancellation Policy",
    content: "Free cancellation up to 24 hours before check-in. Late cancellations are charged one night's stay.",
    category: "policy",   // faq | policy | menu | service | general
  },
});

// 2. Generate and store embedding (fire-and-forget — don't await in a response handler)
generateEmbedding(item.content).then(async (embedding) => {
  await prisma.$executeRaw`
    UPDATE "KnowledgeItem"
    SET embedding = ${embedding}::vector
    WHERE id = ${item.id}
  `;
}).catch(console.error);
```

---

## Embedding Model

- **Model**: `text-embedding-004` via `@google/genai`
- **Dimensions**: 768
- **Client**: `src/lib/embeddings.ts` → `generateEmbedding(text: string): Promise<number[]>`

```typescript
import { generateEmbedding } from "@/lib/embeddings";
const vector = await generateEmbedding("some text to embed");
// vector is number[] with 768 elements
```

---

## Cosine Similarity Search

See `src/lib/rag.ts` for the production implementation. Core pattern:

```typescript
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

async function searchKnowledge(agentId: string, query: string, limit = 5) {
  const queryEmbedding = await generateEmbedding(query);

  const results = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    similarity: number;
  }>>`
    SELECT id, title, content, category,
      1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM "KnowledgeItem"
    WHERE "agentId" = ${agentId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results.filter(r => r.similarity > 0.7); // threshold
}
```

---

## Knowledge Categories

| Category | Used For |
|----------|---------|
| `faq` | General frequently asked questions |
| `policy` | Rules, cancellation, terms |
| `menu` | Food/drink items (restaurant) |
| `service` | Services offered, procedures |
| `general` | Everything else |

---

## Where RAG Fits in the Voice Call

1. Customer starts call → `buildAgentPrompt()` in `src/lib/gemini/agent-prompts.ts` runs
2. It calls `searchKnowledge(agentId, seedQuery)` using a generic seed or the agent's topic
3. Top matching knowledge items are injected into the system prompt
4. Gemini uses this context to answer questions accurately

To improve retrieval, use more specific `title` and `content` text that matches how customers phrase questions.
