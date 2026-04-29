# AgentHub AI Pipeline — Internals

How the voice + AI stack actually works at runtime: what gets sent to Gemini, when Claude runs, how RAG retrieval is triggered, what tools the agent can call, and how the model is tuned per agent type. Read after `PRODUCT_FLOW.md` (which covers the user-facing journeys) when you need the *AI-engineering* details.

---

## TL;DR

Three models, two phases:

```
DURING THE CALL (real-time)              AFTER THE CALL (Inngest, asynchronous)
─────────────────────────────────        ─────────────────────────────────────
Gemini Live API                          Claude Sonnet 4
  - WebSocket bidirectional voice          - Reads transcript JSON
  - System prompt baked at connect          - Returns summary, sentiment,
  - Tools: info getters + captureLead          action items, topics, escalated
  - VAD-managed turn taking                - Writes back to AgentSession

Gemini text-embedding-001
  - Pre-call: knowledge retrieval (RAG)   Resend
  - Knowledge upload: vector storage        - Lead-capture email
                                          - Quota threshold emails
```

The Gemini Live session is the only model the caller actually hears. Everything else fires after the call.

---

## Phase 1 — Setup: assembling the system prompt

Triggered when the caller clicks "Start Call" — `POST /api/public/agent/[slug]/session` (`src/app/api/public/agent/[slug]/session/route.ts`).

The route builds **one big system instruction string** that is baked into the Gemini Live session at WebSocket connect-time. It is *not* re-fetched per turn. Anything the agent needs to know during the call must be in this prompt or accessible via a tool.

### Prompt construction order

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. BASE INSTRUCTIONS (per-template family)                           │
│    src/lib/gemini/agent-prompts.ts                                   │
│      - baseInstructions       (SMB agents — concise, 2-3 sentences) │
│      - interviewBaseInstructions  (interview agents — depth-first,  │
│        with the explicit NON-NEGOTIABLE VOICE RULES at the top)     │
├─────────────────────────────────────────────────────────────────────┤
│ 2. PER-TEMPLATE PROMPT                                               │
│    src/lib/agents/{template}-agent.ts:getSystemPrompt(config, ctx)   │
│      - Hotel:      hotel info + listRooms guidance                   │
│      - Medical:    clinic info + listDoctors + flagEmergency rules   │
│      - Restaurant: restaurant info + getMenu                         │
│      - Legal:      firm info + disclaimer                            │
│      - Interview:  candidate profile + 5-round structure             │
├─────────────────────────────────────────────────────────────────────┤
│ 3. CALLER CONTEXT (if pre-call form was used)                        │
│    "Caller selected '{callContext}' before the call — address it."  │
├─────────────────────────────────────────────────────────────────────┤
│ 4. PERSONALITY + RULES (owner-configured)                            │
│    Agent.personality, Agent.rules                                    │
├─────────────────────────────────────────────────────────────────────┤
│ 5. BUSINESS CONTEXT                                                  │
│    Business.name + description + phone + address                     │
├─────────────────────────────────────────────────────────────────────┤
│ 6. STRUCTURED BUSINESS DATA                                          │
│    src/lib/rag.ts:buildBusinessDataContext()                         │
│    All BusinessData rows for the agent — rooms, menu, doctors, etc. │
├─────────────────────────────────────────────────────────────────────┤
│ 7. RAG CONTEXT (top-k=10 knowledge items)                            │
│    src/lib/rag.ts:queryKnowledge(agentId, seed, 10)                  │
│    Seed: agent.greeting (or candidate's tech stack for interview)    │
│    pgvector cosine similarity, threshold=0.3                         │
├─────────────────────────────────────────────────────────────────────┤
│ 8. UNIVERSAL CAPTURE-LEAD RULE (SMB agents only — skipped for        │
│    interview which has its own scoring tools)                        │
│    src/lib/gemini/agent-prompts.ts:leadCaptureRule                   │
│    "You provide info only. Use captureLead for any transaction."    │
└─────────────────────────────────────────────────────────────────────┘
```

The whole thing is typically 2,000–6,000 characters by the time it's assembled. Larger prompts → diluted attention. Order matters: rules at the top get higher priority from the model, which is why **voice-pacing rules live in the BASE instructions and at the very top of the per-template prompt**, not buried in the middle.

### The customizable override path

If `Agent.systemPrompt` is set, it replaces section 2 (the per-template prompt) for non-interview agents — full owner control. For interview agents, the auto-generated prompt is kept (because it's load-bearing) and `agent.systemPrompt` is appended as **Additional Owner Instructions**. This prevents owners from accidentally breaking the 5-round structure.

---

## Phase 2 — Gemini Live WebSocket lifecycle

`src/lib/gemini/live-session.ts` opens a WebSocket to the Gemini Live API with this config:

```typescript
client.live.connect({
  model: "gemini-3.1-flash-live-preview",
  config: {
    responseModalities: [Modality.AUDIO],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    tools: [{ functionDeclarations: tools }],

    // Per-agent-type tuning (tuningForAgent helper)
    temperature: 0.6 (interview) | 0.7 (SMB),
    enableAffectiveDialog: true,

    // Turn detection — the most important config for voice UX
    realtimeInputConfig: {
      automaticActivityDetection: {
        silenceDurationMs: 2000 (interview) | 1200 (SMB),
        endOfSpeechSensitivity: END_SENSITIVITY_LOW,
        startOfSpeechSensitivity: START_SENSITIVITY_LOW,
      },
    },

    // Sliding-window context compression — for calls approaching the
    // 10-min cap, keeps the model attending to recent turns instead of
    // drowning in early conversation history. Token counts are STRINGS
    // (protobuf int64 convention), not numbers.
    contextWindowCompression: {
      triggerTokens: "16000",
      slidingWindow: { targetTokens: "8000" },
    },

    // Server emits sessionResumptionUpdate messages with handles we can
    // store and use on reconnect. Captured-only today (see getResumptionHandle());
    // wiring the actual reconnect path is a future phase.
    sessionResumption: {},

    // Transcription for both sides — drives the visible transcript panel
    inputAudioTranscription: {},
    outputAudioTranscription: {},

    // Optional voice + language (owner-configured)
    speechConfig?: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    systemLanguageCode?: "hi" | "es" | etc. (omitted for English),
  },
});
```

### Why these tunings matter

| Setting | Effect on the conversation |
|---|---|
| `silenceDurationMs: 2000` (interview) | The model waits 2 full seconds of silence before declaring end-of-turn. Candidates pausing to think are not cut off mid-thought. |
| `silenceDurationMs: 1200` (SMB) | Shorter pause for transactional callers — "I'd like to know about rooms" doesn't need 2s of patience. |
| `endOfSpeechSensitivity: LOW` | Bias toward "still speaking" rather than "done speaking" when the audio level drops briefly (e.g., breath, "um"). |
| `temperature: 0.6` (interview) | Less random question selection. Without this, the model rephrases similar concepts as different-looking questions and the candidate feels they're being asked the same thing twice. |
| `temperature: 0.7` (SMB) | A bit more variability for natural-sounding callbacks. |
| `enableAffectiveDialog: true` | The model adapts tempo/tone to the caller's emotional state (frustration, hesitation, enthusiasm). |

**These are NOT defaults. The Gemini Live API defaults are tuned for a chatbot — they're aggressive on VAD and creative on temperature.** For a real interview or business-receptionist scenario, those defaults produce the "rushed, repetitive" UX the original code had.

### Audio path

```
Caller's mic
  └─ AudioWorklet (public/audio-capture-worklet.js)
       Resamples to 16 kHz mono PCM16
  └─ base64-encode → WebSocket sendRealtimeInput({ audio })
                     mimeType: "audio/pcm;rate=16000"
                                 │
                          Gemini processes
                          (VAD → ASR → LLM → TTS)
                                 │
       PCM16 base64 ← WebSocket onmessage(serverContent.modelTurn.parts)
                       inlineData.data, sample rate 24 kHz
  └─ pcm16Base64ToFloat32 → AudioBufferSourceNode
       Sequential scheduling (each chunk starts after the previous ends)
       Tracked in activeSourceNodes for interruption support
  └─ Caller's speaker
```

Key invariants:
- **In = 16 kHz, Out = 24 kHz**. Mismatched sample rates would cause chipmunk audio.
- **Output chunks must play sequentially.** The `nextPlayTime` tracking prevents two chunks playing simultaneously when Gemini bursts multiple audio fragments per turn.
- **Interruption** = `source.stop()` on every active node + `nextPlayTime = 0`. The agent's voice cuts cleanly when the caller starts speaking.
- **Setup-complete gating.** The worklet may produce audio before the WebSocket has finished its handshake. Pre-setup audio is queued and flushed when `setupComplete` arrives.

---

## Phase 3 — Tool calls during the conversation

Gemini Live can call functions during a turn. Our agents expose two classes of tools:

### A) Information tools (per-template, server-data-backed)

| Tool | Where | Behavior |
|---|---|---|
| `listRooms`        | hotel agent      | Returns `BusinessData.rooms` JSON or fallback message |
| `listDoctors`      | medical agent    | Returns `BusinessData.doctors` JSON, optionally filtered by day |
| `getMenu`          | restaurant agent | Returns `BusinessData.menu` items, optionally filtered by category |
| `flagEmergency`    | medical agent    | Returns canonical 911/108 instructions; never makes things up |

All four resolve via `live-session.ts:fetchToolData()` which fetches `/api/public/agent/{slug}/data`. If the owner hasn't configured the relevant `BusinessData` row, the fallback says "no data on file — the team will share details on follow-up" so the agent doesn't hallucinate.

### B) Universal `searchKnowledge` tool (every agent — SMB AND interview)

Dynamic RAG retrieval. Defined in `src/lib/gemini/agent-prompts.ts:searchKnowledgeTool`. Always appended to every agent's tool list (not removable via `enabledTools`).

```typescript
{
  name: "searchKnowledge",
  description: "Search the business's knowledge base for information relevant to a specific question that came up in the conversation. Use when the caller asks about a topic that wasn't covered in initial context, or when you need more detail.",
  parameters: { query: string (required) },
}
```

When fired, `live-session.ts:searchKnowledge(query)` POSTs to `/api/public/agent/{slug}/search-knowledge` with the per-session `updateToken` Bearer. Server runs `queryKnowledge(agentId, query, k=5)` against pgvector and returns top-k snippets. The dispatch truncates each snippet's content to 600 chars before handing it back to the model so a long FAQ doesn't drown the audio response.

**This is the fix for the "RAG runs once at session start" limitation.** The static system prompt still injects the initial top-10 retrieval (good for the opening of the call), and now the model can pull more context on demand when the conversation pivots topics.

The base instructions (`baseInstructions` and `interviewBaseInstructions` in `agent-prompts.ts`) explicitly tell the model to reach for `searchKnowledge` when the caller asks about something specific that wasn't in initial context — so the model knows the tool exists.

### C) Universal `captureLead` tool (SMB agents only)

The single most important tool. Defined once in `src/lib/gemini/agent-prompts.ts:captureLeadTool` and appended to every SMB agent's tool list (always — owners cannot disable it via `enabledTools`).

```typescript
{
  name: "captureLead",
  description: "Record the caller's contact details and intent so the business owner can follow up. MUST be called whenever the caller wants to book, order, schedule, reserve, or otherwise transact — you cannot complete those actions yourself.",
  parameters: {
    name?, phone?, email?, intent (required), urgency?, notes?
  },
}
```

When the agent calls it, `live-session.ts:persistCapturedLead()` immediately PATCHes `/api/public/agent/{slug}/session/{id}` with the lead — **during the call, not at the end**. So if the caller drops mid-conversation, the lead is already in the DB.

This pairs with the `leadCaptureRule` system-prompt clause that tells the model: *"you cannot book/order/schedule yourself. You MUST call captureLead. NEVER claim to have completed a transaction yourself."* This is the difference between an agent that lies ("your booking is confirmed") and one that's honest ("I've passed your details to the front desk — they'll call you back to confirm").

### D) Interview-only tools

| Tool | Behavior |
|---|---|
| `scoreAnswer({round, questionNumber, score, feedback})` | Records a single answer's score. Tracked locally in `live-session.ts:interviewScores` array. |
| `advanceRound({nextRound, summary})` | Advances to the next round. Tracked in `interviewRounds`. |
| `endInterview({overallImpression, overallFeedback})` | Ends the interview, sets `interviewResult`. |

**Important pacing decision:** the interview prompt now tells the model to **batch scoreAnswer calls at end-of-round**, not after every single topic. This was the previous symptom: the agent called `scoreAnswer` 4-6 times per round, each one a server round-trip that broke the audio flow and the model's sense of "where we are in the conversation." Batching at round transitions keeps the round itself a continuous conversation.

### Tool dispatch flow

```
Gemini sends toolCall.functionCalls[]
  │
  ▼ (in handleMessage, async loop)
For each fc in functionCalls:
  result = handleAgentToolCall(agentType, fc.name, fc.args)
            └─ Per-template handler in src/lib/agents/{template}-agent.ts
            └─ Universal captureLead handler in agent-prompts.ts
  if (interview) update local state (interviewScores / Rounds / Result)
  if (captureLead) await persistCapturedLead(args)  ← PATCH to backend now
  if (data tool) result = await fetchToolData(name, args)  ← /api/public/.../data
  sendToolResponse(fc.id, fc.name, result)  ← back to Gemini
```

Tool handlers are intentionally **client-side** (running in the caller's browser). The browser already has the auth context (the `updateToken` Bearer for session PATCH, the public `/data` endpoint for owner data). Putting tool execution server-side would require a second WebSocket between the browser and our server, which we don't need.

---

## Phase 4 — RAG retrieval

`src/lib/rag.ts` + `src/lib/embeddings.ts`. Two flows:

### Embedding generation (write path)

When the owner adds a `KnowledgeItem`:

1. Row is created with `embeddingStatus: "pending"`.
2. Async kickoff: `generateAndStoreEmbedding(itemId, "{title}: {content}")`.
3. Calls `gemini-embedding-001` with `outputDimensionality: 768`.
4. Stores via raw SQL (pgvector requires it):
   ```sql
   UPDATE "KnowledgeItem" SET embedding = $1::vector WHERE id = $2
   ```
5. On success: `embeddingStatus = "ready"`. On failure: `embeddingStatus = "failed"`, `embeddingError` populated for the dashboard.

The async kickoff means the POST returns instantly. Owners can see in the dashboard which knowledge items haven't been indexed yet.

### Knowledge retrieval (read path)

Once at session creation:

1. Build a seed query:
   - For interview: `"technical interview questions about ${candidateStack}"`
   - For everyone else: `agent.greeting` or `"Help with ${agentName}"`
2. Generate the embedding for the seed.
3. pgvector cosine similarity search:
   ```sql
   SELECT title, content, category, embedding <=> $1::vector AS distance
   FROM "KnowledgeItem"
   WHERE "agentId" = $2 AND "isActive" = true AND embedding IS NOT NULL
   ORDER BY distance ASC LIMIT 10
   ```
4. Filter results above similarity threshold 0.3 (= distance < 0.7).
5. Build a context block and append to the system prompt.

**Two-phase retrieval (since AI pipeline polish):**

1. **One-shot at session start** — top-10 RAG snippets are injected into the system prompt using a seed query (`agent.greeting` for SMB, `"technical interview questions about ${techStack}"` for interview). This grounds the opening of the call.
2. **On-demand mid-call via `searchKnowledge` tool** — when the conversation pivots to a topic the seed didn't surface, the model can call the tool with a fresh query. Top-5 snippets returned inline. See "Tool calls during the conversation > Universal searchKnowledge tool" above.

The two phases are complementary: the static block primes the model, the tool fills in the gaps as the conversation evolves. Together they're effectively the same as a per-turn retrieval but cheaper (we only run vector search when the model decides it's needed, not on every turn).

---

## Phase 5 — Post-call: Claude analysis

When the session PATCH arrives with `status: "completed"` + a transcript, `triggerPostCallAnalysis(sessionId)` (in `src/lib/post-call.ts`) sends an Inngest event. The handler at `src/inngest/functions/post-call-analysis.ts` runs durably with 3 retries, max 10 concurrent.

```
session/post-call event
  │
  ├── step.run("fetch-session")
  │     prisma.agentSession.findUnique with agent + business
  │     skip if summary != null  (deduplication marker)
  │     skip if transcript empty
  │
  ├── INTERVIEW BRANCH (templateType === "interview" && interviewData?.scores)
  │     ├── step.run("generate-interview-report")
  │     │     Claude builds a structured report:
  │     │       overallScore, verdict, summary,
  │     │       roundBreakdown[], communicationFeedback,
  │     │       technicalStrengths[], technicalWeaknesses[],
  │     │       areasToImprove[], recommendedResources[]
  │     │
  │     └── step.run("save-interview-report")
  │           Format as markdown into AgentSession.summary
  │           Set sentiment=verdict, sentimentScore=overallScore/10
  │
  └── GENERIC BRANCH (everyone else)
        ├── step.run("generate-analysis")
        │     Claude returns:
        │       summary, sentiment, sentimentScore,
        │       actionItems[{action, priority}], topics[], escalated
        │
        ├── step.run("save-analysis")
        │     Write everything onto AgentSession
        │
        └── step.run("deliver-lead-email")
              src/lib/lead-delivery.ts:deliverLead(sessionId)
              Idempotent via leadDeliveredAt
              Email + (optional) signed webhook
```

Both branches end with `flushTraces()` so LangSmith captures the full call.

### Why Claude, not Gemini, for post-call?

We use Claude Sonnet 4 here because the post-call analysis needs strong instruction-following on a structured-output schema (`actionItems` with `priority` enum, `sentiment` enum, etc.) and Sonnet's tool-use + structured output is more reliable than Gemini's at this size. Gemini handles the real-time voice; Claude handles the reasoning afterward.

### Why Inngest, not a setTimeout?

Three reasons:
1. **Durability** — if the server restarts mid-analysis, Inngest re-runs from the last completed step.
2. **Retries** — Claude API timeouts and transient Resend failures retry automatically.
3. **Concurrency control** — `concurrency: { limit: 10 }` prevents a burst of completed calls from rate-limiting Claude.

Fallback: if Inngest is down, `post-call.ts` falls back to a direct HTTP POST to `/api/internal/post-call` (signed with `INTERNAL_API_SECRET`). Single-shot, no retry, but the session data is durable in the DB.

---

## Failure modes and what they look like

| Symptom in the call | Likely cause | Where to look |
|---|---|---|
| Agent talks over the candidate / cuts them off | VAD too aggressive (silence threshold too low) | `live-session.ts:tuningForAgent` |
| Agent asks the same question twice | Either VAD treats a thinking pause as end-of-turn (then the agent rephrases the question) OR temperature too high (model picks "different" wording for an essentially identical question) | `tuningForAgent` + system prompt's "NEVER ask the same question twice" rule |
| Agent rushes through topics | Default temp + interview prompt without the explicit pacing rules at the top | `interview-agent.ts` (top-level VOICE PACING block) |
| Tool calls visibly pause the audio | Each `scoreAnswer`/`advanceRound` is a server round-trip — too many of them break the audio stream | Interview prompt's "DO IT SILENTLY, NOT MID-CONVERSATION" section batches scoring at end-of-round |
| Agent gives generic / canned answers | RAG retrieval returned 0 hits OR the system prompt is not specific to the candidate | Check `KnowledgeItem.embeddingStatus` in DB; check `BusinessData` rows; check that pre-call form filled `candidateContext` correctly |
| Agent never calls `searchKnowledge` even when the caller asks specifics | Either (a) the model thinks the static prompt already has the answer, or (b) the tool description is too vague | Tighten the tool's `description` in `agent-prompts.ts:searchKnowledgeTool` and the corresponding line in `baseInstructions` |
| Long calls (8+ min) lose track of earlier conversation | Context compression triggering too aggressively or window too small | Adjust `triggerTokens`/`targetTokens` in `live-session.ts` — both are STRINGS not numbers |
| Agent lies about completing a booking | Missing `leadCaptureRule` or removed `captureLead` tool | `agent-prompts.ts` — both are non-removable for SMB agents |
| Caller hung up but no email arrived | Either `transcript` was empty, or `leadDeliveredAt` already stamped (idempotency), or no recipient on `Business.notificationEmail` and no `User.email` | Check `lead-delivery.ts` logs; the recipient-missing case now logs `[LeadDelivery] DROPPED — no recipient email` to Sentry |
| Email arrived but webhook didn't fire | `webhookUrl` not set, or first attempt failed silently | `lead-delivery.ts:deliverWebhook` returns `{ ok, status, error }` — check the Inngest run output |
| Mid-call disconnect lost the lead | Lead PATCH timing — `captureLead` tool fires the PATCH immediately, not at end-of-call | `live-session.ts:persistCapturedLead` runs on the tool call directly, not at session end |

---

## Tunable knobs (where to adjust each behavior)

| Want to change | File | Symbol |
|---|---|---|
| How long the agent waits before responding | `src/lib/gemini/live-session.ts` | `tuningForAgent.silenceDurationMs` |
| How creative / consistent the agent is | same file | `tuningForAgent.temperature` |
| When/how the conversation context gets compressed | same file | `contextWindowCompression.{triggerTokens,slidingWindow.targetTokens}` (strings) |
| What `searchKnowledge` returns per call | `src/lib/gemini/live-session.ts` | `searchKnowledge()` — `k=5`, content truncation `600` |
| Whether `searchKnowledge` is exposed | `src/lib/gemini/agent-prompts.ts` | non-removable; appended in `getAgentTools` |
| Voice (which Gemini prebuilt voice) | Owner-facing — set on `Agent.voiceName` | dashboard agent settings page |
| Agent's tone / personality | Owner-facing — set on `Agent.personality`, `Agent.rules` | dashboard agent config page |
| What tools an agent has | `src/lib/agents/{template}-agent.ts` + `Agent.enabledTools` (per-business) | template files + agent dashboard |
| The "no-booking-lies" rule | `src/lib/gemini/agent-prompts.ts:leadCaptureRule` | applied to every SMB agent automatically |
| Interview round structure | `src/lib/agents/interview-agent.ts` | `getSystemPrompt()` |
| RAG threshold / k | `src/lib/rag.ts:queryKnowledge()` | `threshold` arg (default 0.3), `limit` arg (default 5; 10 in session route) |
| Embedding model / dimensions | `src/lib/embeddings.ts` | `model: "gemini-embedding-001"`, `outputDimensionality: 768` (must match the `vector(768)` schema column) |
| Post-call analysis prompt | `src/lib/claude.ts:generatePostCallAnalysis` | the inline prompt + `responseSchema` |
| Concurrency limit on Claude | `src/inngest/functions/post-call-analysis.ts` | `concurrency: { limit: 10 }` |
| What's included in the lead email | `src/lib/email.ts:sendLeadCaptureEmail` | inline HTML template |
| Webhook payload shape | `src/lib/lead-delivery.ts:deliverWebhook` | inline `WebhookPayload` interface |

---

## Mental model

Think of it as **three separate runtimes**:

1. **Caller's browser** — owns the WebSocket to Gemini Live, runs the AudioWorklet, executes tool calls (because they need the per-session bearer token), and PATCHes the session as the call progresses.
2. **Our Next.js server** — assembles the system prompt at session-create time, persists captured leads, fronts the public `/data` endpoint, gates owner-only routes via NextAuth, and ships post-call work to Inngest.
3. **Inngest worker** — runs the post-call function durably, calls Claude, calls Resend, calls the owner's webhook.

**Nothing on our server is in the audio path** during the call. The browser talks directly to Gemini's WebSocket. We're not a relay; we just hand out the API key and the system prompt, then get out of the way until the call ends. That's why latency is dominated by Gemini's voice processing and the caller's network — not by our infrastructure.
