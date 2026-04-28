# How AgentHub Works — End to End

A walkthrough of the runtime behavior of the platform: who clicks what, which routes fire, what gets persisted, and how money + leads + emails flow. Read alongside `README.md` (overview) and `CLAUDE.md` (codebase orientation).

---

## TL;DR — the product loop in one paragraph

A small business owner signs up, configures an industry-specific AI voice agent (hotel / medical / restaurant / legal / interview), and copies an `<iframe>` snippet into their existing website. A visitor on that website clicks the widget, talks to the AI, and the agent informs them about services and uses a `captureLead` tool to record their intent. After the call ends, Claude generates a summary and an email lands in the owner's inbox (and optionally a signed JSON webhook fires to Slack / HubSpot / Zapier). The owner opens their dashboard, sees the captured lead with sentiment, marks it `contacted` → `won`, and at month-end exports leads as CSV. Calls are metered against a Stripe-managed plan (Free / Starter / Pro); when they hit 80% / 95% / 100% of monthly minutes the owner gets a notification, and over-quota visitors are rejected with 429 until they upgrade.

---

## The two actors

| Actor | Where they live | What they pay for | Auth |
|---|---|---|---|
| **Business owner** | `/business/*` dashboard | A monthly plan | Email/password OR Google OAuth via NextAuth |
| **Caller (end customer)** | An iframe on the owner's website OR `/a/{slug}` directly | Nothing | None — anonymous |

The caller never sees AgentHub branding except a tiny "Powered by AgentHub" footer. The owner-facing dashboard is the only place that needs login.

---

## Journey 1 — Business owner: sign up → live widget

### 1. Sign up + onboarding
1. Owner visits `/register` (credentials) or clicks Google OAuth on `/login`.
2. NextAuth (`src/lib/auth.ts`) creates a `User` row.
3. They land on `/business/onboarding` — a 4-step wizard:
   - **Step 1**: business name + industry picker → creates `Business` row with a unique slug (`src/lib/slug.ts`).
   - **Step 2**: agent personality + industry-specific config fields (`Agent.config` JSON) → creates `Agent` row.
   - **Step 3**: FAQ entry — each FAQ becomes a `KnowledgeItem` with a 768-dim vector embedding (Gemini `gemini-embedding-001`) for RAG retrieval. Embeddings are generated **asynchronously** with status tracking (`embeddingStatus: pending → ready | failed`) so the owner can see if any failed.
   - **Step 4**: shows the public link `agenthub.app/a/{slug}`.

### 2. Tweak + add structured data
On `/business/agents/{agentId}`:
- Tweak greeting / personality / rules / system prompt.
- Add structured data (`BusinessData` table — JSON keyed by `dataType`):
  - Hotel → `rooms` (with prices, amenities)
  - Restaurant → `menu` (`MenuBuilder` component)
  - Medical → `doctors` (`DoctorRoster` component)
- Choose voice (Gemini prebuilt voices) and language.

### 3. Embed on their website
Top of the agent page (`src/components/business/EmbedInstallCard.tsx`) shows a copy-paste snippet:
```html
<iframe
  src="https://agenthub.app/embed/{slug}"
  width="380" height="640"
  allow="microphone"
  style="border:0;border-radius:16px"
></iframe>
```
The `allow="microphone"` is required — without it, browsers block `getUserMedia` in cross-origin frames.

The `/embed/{slug}` route is the same React component as `/a/{slug}` rendered in `mode="embed"` (no header, no cookie banner). `next.config.ts` sets `Content-Security-Policy: frame-ancestors *` for `/embed/*` only — the rest of the app stays default-secure.

### 4. Configure lead delivery (optional)
On `/business/settings`:
- **Notification email** (defaults to the user's account email).
- **Webhook URL** — when set, every captured lead also fires a signed JSON POST. The signing secret (`Business.webhookSecret`) is auto-minted on first delivery and shown to the owner with a copy/show toggle.

### 5. Pick a plan
On `/business/billing`:
- Three plans seeded by `prisma/seed-plans.mjs`:
  - **Free**: 30 min/mo, 1 agent, $0
  - **Starter**: 200 min/mo, 3 agents, $29
  - **Pro**: 800 min/mo, 10 agents, $99
- Upgrade hits `/api/billing/checkout` → Stripe Checkout Session → return URL stamps a `Subscription` row via the webhook. Without `STRIPE_SECRET_KEY` set, the upgrade buttons are hidden — Free tier still works.

---

## Journey 2 — Caller: visits site → leaves a lead

This is the hot path. Everything below happens in **one round trip** for the call setup, then audio streams over WebSocket for the duration.

### 1. Page load
Visitor lands on a page that has the iframe. The `/embed/{slug}` page mounts `<PublicAgentExperience>` (client component, `src/components/agent/PublicAgentExperience.tsx`). It fetches `/api/public/agent/{slug}` for the agent metadata and `/api/public/agent/{slug}/data` for any structured data (used by the pre-call screens — menu preview, doctor roster, etc.).

### 2. Click "Start Call"
Triggers `connect()` in `PublicAgentExperience`. This POSTs `/api/public/agent/{slug}/session`, which:

1. **Rate limits** by IP and slug (`checkSessionRateLimit` in `src/lib/ratelimit.ts`, Upstash sliding window).
2. **Plan-quota check** (`checkBusinessPlanQuota`): SUM(`AgentSession.duration`) for the business since `Subscription.currentPeriodStart`. If over `plan.monthlyMinutes * 60`, returns 429 with `{ plan, usedMinutes, limitMinutes }` and the caller sees a friendly "this agent has reached its quota" message. No subscription row → fall back to the Free plan.
3. **Builds the system prompt** (`src/lib/gemini/agent-prompts.ts`):
   - Base instructions (tone, brevity)
   - Per-template prompt (`src/lib/agents/{template}-agent.ts`)
   - Business name / phone / address
   - Structured `BusinessData` (rooms, menu, doctors…)
   - RAG context — top 10 `KnowledgeItem` matches from a seeded query (`queryKnowledge` in `src/lib/rag.ts`, pgvector cosine similarity)
   - **The hard rule**: `leadCaptureRule` — appended to every SMB agent prompt: *"You are an information agent, not a booking agent. Never claim to have booked anything. Use captureLead for any transactional intent."*
4. **Creates an `AgentSession`** with a fresh 32-byte hex `updateToken` (security: prevents anyone with just the cuid from forging transcripts).
5. **Returns** `{ sessionId, updateToken, apiKey, systemPrompt, tools, voiceName, language }` to the browser.

### 3. WebSocket opens
The browser instantiates `GeminiLiveSession` (`src/lib/gemini/live-session.ts`) and calls `connect(apiKey)`. This opens a WebSocket to Gemini Live (`gemini-3.1-flash-live-preview` model). Audio capture starts via `useAudioStream` — the AudioWorklet at `public/audio-capture-worklet.js` resamples mic input to **16 kHz PCM16 mono** and base64-encodes it.

```
mic → AudioWorklet (16 kHz PCM16) → base64 → WebSocket → Gemini Live
                                                            │
audio out (24 kHz PCM16) ← scheduled sequential playback ←──┘
```

Both sides also get text transcription (`inputAudioTranscription`, `outputAudioTranscription`) which renders in the `<TranscriptPanel>`.

### 4. Tool calls during the conversation
The agent has two kinds of tools:
- **Information tools** (per template): `listRooms`, `listDoctors`, `getMenu`, `flagEmergency`. When fired, `live-session.ts:fetchToolData` does a `fetch('/api/public/agent/{slug}/data')` to return real owner-supplied data (or a friendly fallback if none is configured).
- **Universal `captureLead`** (every SMB agent): the agent calls this any time the caller wants something transactional. Args: `{ name?, phone?, email?, intent, urgency?, notes? }`. Behavior:
  1. `live-session.ts:persistCapturedLead` immediately PATCHes `/api/public/agent/{slug}/session/{sessionId}` with `{ capturedLead: args }`, authenticated by the `updateToken` Bearer header.
  2. Server stamps `capturedAt` and mirrors `name/phone/email` into the top-level `callerName/callerPhone/callerEmail` columns.
  3. The PATCH happens during the call, not at the end — so a network drop mid-call doesn't lose the lead.

The agent then verbally tells the caller "I've passed your details to the team — they'll call you back shortly to confirm." It does not claim to have booked anything.

### 5. Call ends
Three exit paths, all converge:
- Caller clicks the red "End" button → `handleEndCall`
- 9-minute soft cap fires (Gemini hard-limits at 10) → same path
- Browser closes → `beforeunload` handler fires `saveSession` with `keepalive: true`

`saveSession` PATCHes the session with `{ duration, transcript, status: "completed" }` (Bearer token required). The PATCH route:
1. Persists transcript + duration.
2. Calls `recordBusinessSessionUsage` → fires `notifyQuotaThresholds` (fire-and-forget) which checks if usage just crossed 80 / 95 / 100 % and emails the owner if so (idempotent via `Subscription.lastQuotaNotice`).
3. If `status === "completed"` and there's a transcript → `triggerPostCallAnalysis(sessionId)`.

### 6. Post-call analysis (Inngest)
`triggerPostCallAnalysis` (`src/lib/post-call.ts`) sends an Inngest event `session/post-call`. The handler (`src/inngest/functions/post-call-analysis.ts`) runs durably with 3 retries, max 10 concurrent:

1. **`fetch-session`** step — pulls the session + agent + business
2. Skip if `summary != null` (deduplication — Inngest may retry the whole function)
3. **`generate-analysis`** step — Claude Sonnet 4 analyzes the transcript and returns `{ summary, sentiment, sentimentScore, actionItems, topics, escalated }`
4. **`save-analysis`** step — writes those to `AgentSession`
5. **`deliver-lead-email`** step — calls `deliverLead(sessionId)`

If Inngest is unavailable, `post-call.ts` falls back to a direct HTTP POST to `/api/internal/post-call` (signed with `INTERNAL_API_SECRET`).

### 7. Lead delivery
`deliverLead` (`src/lib/lead-delivery.ts`) is **idempotent** via `AgentSession.leadDeliveredAt`:

1. Skip if already delivered.
2. Skip if low-signal (no captured lead, transcript < 4 messages, no Claude summary).
3. Pick recipient: `Business.notificationEmail` || `User.email` of the owner.
4. **Email send** via Resend (`sendLeadCaptureEmail` in `src/lib/email.ts`) — HTML email with caller details, intent, urgency badge, sentiment, summary, and a deep link to the session.
5. Stamp `leadDeliveredAt = now()` to prevent re-send.
6. **Webhook send** (if `Business.webhookUrl` set):
   - Mint `Business.webhookSecret` lazily if it doesn't exist yet.
   - Build payload: `{ event: "lead.captured", business, agent, session, caller, lead, analysis }`.
   - Sign body with HMAC-SHA256, send `X-AgentHub-Signature: sha256=<hex>` header.
   - 10-second timeout, single attempt — Inngest's function-level retries cover the rest.

The owner sees a structured email within ~30 seconds of the call ending. If they wired Slack, the lead also lands as a JSON message in the channel.

### 8. Owner reviews + acts
The owner opens `/business/agents/{agentId}/sessions`, clicks a session → `<SessionDetailModal>` opens with:
- **Captured lead** block — name / phone / email (with `tel:` and `mailto:` links) / intent / urgency / notes
- **Lead status dropdown** — `new` → `contacted` → `qualified` → `won` / `lost` / `archived`. Optimistic update PATCHes `/api/sessions/{id}` with `{ leadStatus }`.
- Claude summary, sentiment, topics, action items
- Full transcript

At month-end, owner clicks "Export CSV" on the sessions list. `/api/business/{businessId}/leads/export` returns a CSV of every session in the date window with a captured lead OR a Claude summary.

---

## Plan + quota mechanics

```
┌─────────────────────────────────────────────────────────────┐
│  /api/public/agent/{slug}/session POST                       │
│    1. checkSessionRateLimit(ip, slug)   ← Upstash, abuse    │
│    2. checkBusinessPlanQuota(businessId)                     │
│         resolves Subscription → BillingPlan                  │
│         SUMs AgentSession.duration since periodStart         │
│         429 if over plan.monthlyMinutes * 60                 │
│    3. proceed → create session                               │
└─────────────────────────────────────────────────────────────┘
```

- **Source of truth**: `Subscription.currentPeriodStart/End` (set by Stripe webhooks).
- **No subscription row** → fall back to free plan, period anchored to start of current UTC month.
- **No Redis required for quota** — the SUM aggregate runs on Postgres and is fast (sub-100ms with the existing `AgentSession.createdAt` index).
- **Threshold notifications** — `notifyQuotaThresholds` advances `Subscription.lastQuotaNotice` only forward (`none → 80 → 95 → 100`). Same threshold within the same period is a no-op.

---

## Stripe billing flow

```
Owner clicks Upgrade
   │
   ▼
POST /api/billing/checkout
   │  metadata: { businessId, planId }
   ▼
Stripe Checkout (hosted page)
   │
   ▼
On payment success → Stripe webhook
   │
   ▼
POST /api/billing/webhook   ← signature verified via STRIPE_WEBHOOK_SECRET
   │
   ├── checkout.session.completed
   │      → upsert Subscription { stripeCustomerId, stripeSubscriptionId, planId }
   │
   ├── customer.subscription.{created,updated}
   │      → reconcile planId from price ID, set period dates, status
   │
   ├── customer.subscription.deleted
   │      → drop to Free plan immediately, status="canceled"
   │
   └── invoice.payment_failed
          → status="past_due" (quota stays in force on existing plan)
```

Without Stripe configured, all billing routes return 503 and the UI shows an info notice. Free tier still works because `resolvePlan` falls back to a default Free plan when no `Subscription` row exists.

---

## Security model

Three independent boundaries:

| Boundary | Mechanism | Where |
|---|---|---|
| **Owner-facing API** | NextAuth session cookie | All `/api/business/*`, `/api/sessions/*`, `/api/billing/checkout\|portal` |
| **Anonymous caller PATCH** | Per-session 32-byte hex `updateToken` (Bearer or `x-session-token` header), constant-time compare | `PATCH /api/public/agent/{slug}/session/{sessionId}` |
| **Server-to-server / Stripe / Inngest** | Shared secret OR cryptographic signature | `INTERNAL_API_SECRET` for `/api/internal/post-call`; Stripe signature for `/api/billing/webhook`; HMAC-SHA256 on outbound webhooks |

If `INTERNAL_API_SECRET` is unset the internal endpoint refuses every request with 500 — failing closed instead of open.

---

## Where things live (quick map)

| Concern | File |
|---|---|
| Voice WebSocket session | `src/lib/gemini/live-session.ts` |
| Audio capture (mic → 16 kHz PCM) | `public/audio-capture-worklet.js` + `src/hooks/useAudioStream.ts` |
| System prompt assembly | `src/lib/gemini/agent-prompts.ts` |
| Per-template agent (tools + prompt) | `src/lib/agents/{template}-agent.ts` |
| RAG vector search | `src/lib/rag.ts` |
| Embeddings | `src/lib/embeddings.ts` (`gemini-embedding-001`, 768-dim) |
| Plan + quota logic | `src/lib/ratelimit.ts` |
| Stripe client + helpers | `src/lib/stripe.ts` |
| Lead-capture orchestrator | `src/lib/lead-delivery.ts` |
| Email templates | `src/lib/email.ts` (Resend) |
| Inngest post-call function | `src/inngest/functions/post-call-analysis.ts` |
| Caller-facing UI | `src/components/agent/PublicAgentExperience.tsx` |
| Standalone page | `src/app/a/[slug]/page.tsx` |
| Embeddable widget | `src/app/embed/[slug]/page.tsx` |
| Owner billing page | `src/app/(business)/business/billing/page.tsx` |
| Owner settings (lead delivery) | `src/app/(business)/business/settings/page.tsx` |
| Owner session detail (status workflow) | `src/components/dashboard/SessionDetailModal.tsx` |

---

## Common operational scenarios

**Caller hits a quota'd agent**
→ POST `/api/public/agent/{slug}/session` returns 429 with `{ plan, usedMinutes, limitMinutes }`. The widget shows "this agent has reached its monthly quota — try again later." Owner gets the 100% threshold email (if subscribed). Quota resets on the next billing period.

**Owner deletes the Stripe subscription**
→ Stripe sends `customer.subscription.deleted`. Webhook downgrades them to Free immediately. Next caller faces the 30-min cap. (Variant: if you want to honor the paid period until period_end, change `handleSubscriptionDeleted` in the webhook.)

**Mid-call disconnect**
→ Caller's browser drops. The `captureLead` PATCH already happened during the conversation, so the lead is safe. The transcript may be partial; `beforeunload + keepalive` saves whatever the browser had. Inngest still runs Claude analysis on the partial transcript and sends the email/webhook.

**Inngest down, post-call needs to run**
→ `triggerPostCallAnalysis` falls back to a direct HTTP POST to `/api/internal/post-call` with `INTERNAL_API_SECRET`. Single shot, no retry, but the transcript is already in the DB so a manual re-trigger is possible.

**Webhook receiver is slow / down**
→ 10-second timeout per attempt. The email already went out (idempotency was stamped before the webhook attempt). Inngest's function-level retry will retry the whole post-call function — but `deliverLead` skips early on `leadDeliveredAt`, so the email/webhook won't double-fire on retry.

**Owner adds a new FAQ to a live agent**
→ POST creates `KnowledgeItem` with `embeddingStatus: "pending"`. Async embedding generation runs (`generateAndStoreEmbedding` in `rag.ts`), updates status to `ready` or `failed`. Currently consumed by the **next** session created (RAG runs at session start, not per-turn) — there's a planned refactor to expose RAG as a Gemini tool so it can be called mid-call.

**Caller asks a question outside the agent's knowledge**
→ Static system prompt rules ("never make up information") combined with the captured RAG snippets keep the model from hallucinating in most cases. If they want to book/transact, the agent calls `captureLead` and tells them the team will call back. If it's an emergency on a medical agent, `flagEmergency` returns canonical "call 911 / 108" text.

---

## Phase log (what shipped, in order)

| Phase | Wedge |
|---|---|
| **0** — Security foundation | Mandatory `INTERNAL_API_SECRET`; per-session bearer token on PATCH; `KnowledgeItem.embeddingStatus` so failed embeddings are visible |
| **1** — Honest agents + lead delivery | All transactional mock tools removed; universal `captureLead` tool with hard rule injected into every prompt; Inngest post-call sends a Resend email to the owner after Claude analysis |
| **2** — Distribution | `/embed/{slug}` route + `frame-ancestors *` CSP; install snippet UI on agent dashboard; embedding model fixed (`gemini-embedding-001`) |
| **3** — Monetization | `BillingPlan` + `Subscription` models seeded with Free/Starter/Pro; plan-aware quota replacing the old Redis daily cap; Stripe checkout/portal/webhook; usage gauge + threshold notification emails (80/95/100%) |
| **4** — Polish | Outbound webhook with HMAC-SHA256 signing; lead status workflow (new → contacted → qualified → won/lost/archived); CSV export of leads; settings UI for notification email + webhook URL |
