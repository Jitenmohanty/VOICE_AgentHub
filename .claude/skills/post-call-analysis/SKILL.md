---
name: post-call-analysis
description: "Use when extending or modifying the post-call AI analysis in AgentHub: adding new Claude-generated fields, updating the analysis prompt, changing what gets stored on AgentSession, or displaying new analysis results in the dashboard."
---

# Post-Call Analysis (Claude)

**When**: Extending what Claude extracts after each voice call ends.

---

## Flow

```
Call ends
  → triggerPostCallAnalysis(sessionId)   [src/lib/post-call.ts]
  → POST /api/internal/post-call         [fire-and-forget]
  → Claude Sonnet 4 analyzes transcript
  → Writes to AgentSession in DB
  → Shown in SessionDetailModal
```

---

## Steps to Add a New Analysis Field

### 1. Add field to `AgentSession` in `prisma/schema.prisma`

```prisma
model AgentSession {
  // ... existing fields ...
  myNewField  String?    // use Json? for structured data like arrays/objects
}
```

### 2. Push schema

```bash
npx prisma db push
npx prisma generate
```

### 3. Extend the Claude prompt in `src/lib/claude.ts`

```typescript
const prompt = `Analyze this voice call transcript and return a JSON object with:
- summary: 2-3 sentence summary
- sentiment: "positive" | "negative" | "mixed" | "neutral"
- sentimentScore: number from -1.0 to 1.0
- actionItems: array of { action: string, priority: "high"|"medium"|"low" }
- topics: array of topic strings
- escalated: boolean (was this escalated to a human?)
- myNewField: <describe exactly what to extract>

Return ONLY valid JSON, no markdown.

Transcript:
${transcript}`;

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: prompt }],
});

const analysis = JSON.parse(response.content[0].text);
```

### 4. Write the new field to the database

```typescript
await prisma.agentSession.update({
  where: { id: sessionId },
  data: {
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    sentimentScore: analysis.sentimentScore,
    actionItems: analysis.actionItems,
    topics: analysis.topics,
    escalated: analysis.escalated,
    myNewField: analysis.myNewField,   // ← add here
  },
});
```

### 5. Display in `src/components/dashboard/SessionDetailModal.tsx`

Add the new field to the modal UI with appropriate formatting.

---

## Deduplication Guard

The analysis route skips re-running if `session.summary` is already set:

```typescript
if (session.summary) {
  return NextResponse.json({ skipped: true });
}
```

To force a re-run during development, set `summary = null` on the session directly in Prisma Studio (`npx prisma studio`).

---

## LangSmith Tracing

Wrap the Claude call with `wrapTraced()` so it appears in LangSmith:

```typescript
import { wrapTraced } from "@/lib/langsmith";

const analyzeCall = wrapTraced(async (transcript: string) => {
  // Claude call here
}, { name: "post-call-analysis" });
```
