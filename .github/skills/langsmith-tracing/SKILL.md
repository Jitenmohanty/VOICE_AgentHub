---
name: langsmith-tracing
description: "Use when adding LangSmith observability tracing to Claude, Gemini, or embedding calls in AgentHub. Covers wrapTraced usage, trace naming, and the langsmith.ts client."
---

# LangSmith Tracing

**When**: Adding observability to a new Claude, Gemini, or embedding call.

---

## Basic Usage

```typescript
import { wrapTraced } from "@/lib/langsmith";

// Wrap any async function — traces appear in the LangSmith dashboard
const analyzeTranscript = wrapTraced(async (transcript: string) => {
  // ... call Claude, Gemini, or embeddings here
  return result;
}, { name: "analyze-transcript" });

// Call it normally
const result = await analyzeTranscript(transcript);
```

---

## Naming Convention

Use descriptive `name` values that identify the operation:

| Operation | Suggested name |
|-----------|---------------|
| Post-call Claude analysis | `"post-call-analysis"` |
| RAG embedding generation | `"generate-embedding"` |
| RAG knowledge search | `"rag-search"` |
| Agent prompt building | `"build-agent-prompt"` |
| Gemini session init | `"gemini-session-init"` |

---

## Where It's Used

- `src/lib/claude.ts` — Claude post-call analysis wrapped with `wrapTraced()`
- `src/lib/embeddings.ts` — Gemini embedding calls wrapped with `wrapTraced()`
- `src/lib/rag.ts` — RAG search wrapped with `wrapTraced()`

---

## Client Setup (`src/lib/langsmith.ts`)

The `wrapTraced` export from `@/lib/langsmith` handles the LangSmith client initialization and falls back gracefully if `LANGSMITH_API_KEY` is not set.

---

## Environment Variables

```
LANGSMITH_API_KEY=ls__...
LANGSMITH_TRACING_V2=true
```

Tracing is optional — the app works without it. Set these in `.env.local` for local observability.
