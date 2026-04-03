---
name: database-schema
description: "Use when modifying the Prisma schema, adding new models or fields, running migrations, or working with pgvector embeddings in AgentHub. Covers Neon HTTP adapter gotchas."
---

# Database Schema Changes

**When**: Adding new tables, new fields to existing models, or working with pgvector columns.

---

## Steps

### 1. Edit `prisma/schema.prisma`

```prisma
model FitnessClass {
  id          String   @id @default(cuid())
  agentId     String
  agent       Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  name        String
  instructor  String
  schedule    Json     // { days: string[], time: string }
  capacity    Int      @default(20)
  createdAt   DateTime @default(now())

  @@index([agentId])
}
```

### 2. Add the back-relation on `Agent` (if needed)

```prisma
model Agent {
  // ... existing fields ...
  fitnessClasses FitnessClass[]
}
```

### 3. Push to Neon + regenerate client

```bash
npx prisma db push       # Applies schema to Neon — no migration files needed
npx prisma generate      # Regenerates Prisma client types
```

### 4. Query using the Neon adapter client

```typescript
import { prisma } from "@/lib/db";   // ALWAYS from here — never @prisma/client

const classes = await prisma.fitnessClass.findMany({ where: { agentId } });
```

---

## pgvector Column Pattern

Vector columns cannot use standard Prisma query builders — use raw SQL:

**In `schema.prisma`:**
```prisma
embedding  Unsupported("vector(768)")?
```

**Inserting a vector:**
```typescript
await prisma.$executeRaw`
  UPDATE "KnowledgeItem"
  SET embedding = ${embedding}::vector
  WHERE id = ${itemId}
`;
```

**Cosine similarity search:**
```typescript
const results = await prisma.$queryRaw`
  SELECT id, title, content, category,
    1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
  FROM "KnowledgeItem"
  WHERE "agentId" = ${agentId}
    AND embedding IS NOT NULL
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT ${limit}
`;
```

See `src/lib/rag.ts` for the production pattern.

---

## Key Rules & Gotchas

- **No migration files** — use `npx prisma db push` (Neon serverless doesn't need them)
- **`prisma.$transaction()`** has limitations with the Neon HTTP adapter — prefer sequential queries
- **Always cascade** on Agent/Business relations: `onDelete: Cascade`
- **Always add `@@index([foreignKey])`** on FK columns for query performance
- **JSON columns** (`Json` type) for flexible structured data — used in `Agent.config` and `BusinessData.data`
- **`AgentSession` has no user FK** — callers are anonymous, do not add one

## Schema Hierarchy

```
User → Business → Agent → KnowledgeItem (+ embedding vector(768))
                        → BusinessData  (dataType + JSON data)
                        → AgentSession  (anonymous, transcript JSON)
```
