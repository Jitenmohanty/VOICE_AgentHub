@AGENTS.md

# AgentHub

Multi-tenant voice AI SaaS. Business owners create industry-specific Gemini Live voice agents; embed them in their existing websites; callers talk to the AI; captured leads land in the owner's inbox + (optionally) a signed webhook. Stripe-billed against monthly minute caps.

> For the full runtime walkthrough (caller → quota → Inngest → email → webhook → CSV export), read **`PRODUCT_FLOW.md`**.

---

## Commands

```bash
npm run dev                  # Next.js dev (port 3000)
npm run build                # Production build
npm run lint                 # ESLint

npx prisma db push           # Push schema to Neon (no migration files)
npx prisma studio            # Prisma Studio GUI
npx prisma generate          # Regenerate Prisma client after schema changes

node prisma/seed-plans.mjs   # Upsert Free/Starter/Pro billing plans (idempotent)
```

---

## Tech Stack

| Layer | Tech | Entry point |
|-------|------|-------------|
| Framework | Next.js 16 App Router (TypeScript strict) | `next.config.ts` |
| Auth | NextAuth v5 — JWT, Google + GitHub OAuth + Credentials | `src/lib/auth.ts` |
| Database | PostgreSQL on Neon, Prisma 7.6 + `@prisma/adapter-neon` | `src/lib/db.ts` |
| Vector Search | pgvector (768-dim cosine) | `src/lib/embeddings.ts`, `src/lib/rag.ts` |
| Voice AI | Gemini 3.1 Flash Live (`@google/genai`) — WebSocket | `src/lib/gemini/` |
| Post-Call AI | Claude Sonnet 4 (`@anthropic-ai/sdk`) | `src/lib/claude.ts` |
| Background jobs | Inngest (durable retries) | `src/inngest/` |
| Email | Resend | `src/lib/email.ts` |
| Billing | Stripe Checkout + Portal + webhook | `src/lib/stripe.ts` |
| Rate limit | Upstash Redis | `src/lib/ratelimit.ts` |
| State | Zustand | `src/stores/` |
| UI | Tailwind CSS 4 + shadcn/ui + Radix | `src/components/ui/` |
| Observability | LangSmith + Sentry | `src/lib/langsmith.ts`, `sentry.*.config.ts` |

---

## File Structure

```
src/
├── app/
│   ├── (auth)/           Login / Register / verify-email / reset-password
│   ├── (business)/       Owner dashboard (auth required)
│   │   └── business/
│   │       ├── dashboard/    Overview + usage gauge
│   │       ├── agents/       Agent config, knowledge, data, sessions
│   │       ├── billing/      Plan picker + Stripe portal
│   │       ├── settings/     Profile + lead-delivery (email + webhook URL)
│   │       └── onboarding/   4-step wizard
│   ├── a/[slug]/         Public voice agent — full page (anonymous)
│   ├── embed/[slug]/     Iframe widget — same UI, no chrome (anonymous)
│   └── api/
│       ├── auth/         NextAuth + register + verify-email
│       ├── billing/      checkout / portal / webhook (Stripe)
│       ├── business/     Owner-protected: agent CRUD, knowledge, sessions, usage, leads/export
│       ├── public/       No-auth: agent metadata, session POST/PATCH (Bearer-token gated)
│       ├── sessions/     Owner-protected: session GET/PATCH (status workflow)
│       └── internal/     Server-to-server: post-call (signed by INTERNAL_API_SECRET)
├── components/
│   ├── agent/            PublicAgentExperience (shared by /a/[slug] and /embed/[slug])
│   ├── business/         EmbedInstallCard, MenuBuilder, DoctorRoster
│   ├── dashboard/        SessionDetailModal (lead block + status dropdown), RatingModal
│   ├── public/           Per-template pre-call screens (Restaurant/Medical/Legal)
│   └── ui/               shadcn/ui primitives
├── hooks/
│   ├── useGeminiLive.ts  Voice session lifecycle
│   └── useAudioStream.ts Mic capture (AudioWorklet)
├── inngest/
│   ├── client.ts
│   └── functions/post-call-analysis.ts   Steps: fetch-session → generate-analysis → save-analysis → deliver-lead-email
├── lib/
│   ├── agents/           Per-template prompt + tools
│   ├── gemini/           live-session, audio-utils, agent-prompts (universal captureLead tool + leadCaptureRule)
│   ├── auth.ts
│   ├── claude.ts
│   ├── db.ts             Prisma — import this, not @prisma/client
│   ├── embeddings.ts     gemini-embedding-001 with outputDimensionality=768
│   ├── rag.ts            pgvector cosine search + generateAndStoreEmbedding (sets pending/ready/failed)
│   ├── ratelimit.ts      Upstash limiters + checkBusinessPlanQuota + enforceAgentLimit + notifyQuotaThresholds
│   ├── stripe.ts         Lazy client (returns null if unconfigured) + plan-id ↔ price-id mapping
│   ├── lead-delivery.ts  Email + signed webhook orchestrator (idempotent via leadDeliveredAt)
│   ├── email.ts          Resend templates (welcome, verify, lead, quota warning)
│   ├── post-call.ts      Inngest trigger + HTTP fallback to /api/internal/post-call
│   └── templates.ts      Industry template definitions ← source of truth for configFields
└── stores/               Zustand stores
prisma/
├── schema.prisma
└── seed-plans.mjs        Idempotent plan upsert
public/
└── audio-capture-worklet.js   16 kHz PCM resampler (static asset, NEVER import as a module)
```

---

## Database Schema

```
User (NextAuth)
 └── Business (slug unique)
      ├── notificationEmail        Lead-delivery destination (defaults to owner.email)
      ├── webhookUrl + webhookSecret   Optional outbound webhook with HMAC-SHA256 signing
      ├── Subscription (1:1)
      │     ├── planId             → BillingPlan
      │     ├── status             active | trialing | past_due | canceled
      │     ├── stripeCustomerId / stripeSubscriptionId
      │     ├── currentPeriodStart / End
      │     └── lastQuotaNotice    Idempotency for 80%/95%/100% emails
      └── Agent (config JSON, systemPrompt, greeting, personality, rules, enabledTools[], voiceName, language)
           ├── KnowledgeItem (title, content, category, embedding vector(768), embeddingStatus)
           ├── BusinessData (dataType, data JSON)        rooms / menu / doctors / etc.
           └── AgentSession                                anonymous callers, no User FK
                ├── updateToken                            32-byte hex bearer issued at creation
                ├── transcript JSON, duration, status
                ├── capturedLead JSON                      { name, phone, email, intent, urgency, notes, capturedAt }
                ├── leadStatus                             new | contacted | qualified | won | lost | archived
                ├── leadDeliveredAt                        Email + webhook idempotency marker
                ├── summary / sentiment / topics / actionItems / escalated   (Claude post-call)
                └── rating, feedback                       Caller's own rating

BillingPlan (id = "free" | "starter" | "pro")
 ├── monthlyMinutes
 ├── maxAgents
 ├── priceCents
 └── stripePriceId    nullable — picked up from STRIPE_PRICE_* env on seeding
```

**Key facts:**
- `Agent.config` is a JSON column with template-specific fields (e.g. `hotelName`, `cuisineType`)
- `KnowledgeItem.embedding` is `Unsupported("vector(768)")` — raw SQL in `rag.ts` (parameterized, safe)
- `AgentSession` has **no User FK** — callers are anonymous; identity gated by `updateToken` for PATCH
- `Subscription` is 1:1 with `Business`; **no row = free fallback** (graceful for legacy data + dev)
- Prisma client uses Neon HTTP adapter — always import from `@/lib/db`

---

## Industry Templates

Defined in `src/lib/templates.ts` (configFields, defaultGreeting, defaultPersonality, etc.).
Per-template logic in `src/lib/agents/<template>-agent.ts`.

| Template ID | Tools (info-only) | Notes |
|-------------|-------------------|-------|
| `hotel`     | `listRooms`         | Real data via `BusinessData.rooms`; transactional tools removed in Phase 1 |
| `medical`   | `listDoctors`, `flagEmergency` | `flagEmergency` returns canonical 911/108 instructions |
| `restaurant`| `getMenu`           | Real menu via `BusinessData.menu` |
| `legal`     | (none — LLM answers from prompt) | |
| `interview` | `scoreAnswer`, `advanceRound`, `endInterview` | B2C scoring product, NOT lead-capture |

**Universal `searchKnowledge` tool** (every agent — SMB and interview) — dynamic RAG retrieval via `POST /api/public/agent/[slug]/search-knowledge`. Auth-gated by the per-session `updateToken`. Defined in `src/lib/gemini/agent-prompts.ts:searchKnowledgeTool`, dispatched in `live-session.ts:searchKnowledge()`. Non-removable.

**Universal `captureLead` tool** is appended to every SMB agent (everything except `interview`) by `src/lib/gemini/agent-prompts.ts:getAgentTools`. Owners can disable info tools via `Agent.enabledTools`, but `captureLead` is non-removable — without it the agent has no honest handoff path.

To add a new template: extend `TEMPLATES` in `templates.ts`, create `<name>-agent.ts` in `src/lib/agents/`, add a pre-call component to `src/components/public/`.

---

## Voice Pipeline

```
Browser mic → AudioWorklet (16 kHz PCM16) → base64 → WebSocket → Gemini Live
                                                                    │
Browser speaker ← Web Audio (24 kHz, sequential) ← PCM16 base64 ←──┘
```

- **Worklet**: `public/audio-capture-worklet.js` — served as static asset, **never** import as ES module.
- **Hook**: `src/hooks/useGeminiLive.ts` — connect/disconnect, send audio.
- **Session**: `src/lib/gemini/live-session.ts` — WebSocket lifecycle, tool dispatch, captureLead PATCH (immediate persistence).
- **Audio**: 16 kHz PCM16 mono in / 24 kHz PCM16 out.
- **System prompt**: built once at session create (`/api/public/agent/[slug]/session`), baked into the connection. Re-built on every new call so prompt edits + new knowledge items take effect on the next call (not the current one).

---

## Lead Delivery (Phase 1 + Phase 4)

```
Caller hangs up
  → PATCH /api/public/agent/{slug}/session/{id} { status: "completed", transcript }
  → triggerPostCallAnalysis(sessionId)
  → Inngest: session/post-call
       1. fetch-session
       2. generate-analysis (Claude)        — summary, sentiment, action items
       3. save-analysis                     — writes to AgentSession
       4. deliver-lead-email                — calls deliverLead(sessionId)
            ├─ skip if leadDeliveredAt set (idempotent)
            ├─ skip if low-signal (no lead, no summary, transcript < 4)
            ├─ Resend email to Business.notificationEmail || User.email
            ├─ stamp leadDeliveredAt = now()
            └─ if Business.webhookUrl set:
                 ├─ mint Business.webhookSecret if null
                 ├─ POST signed JSON: X-AgentHub-Signature: sha256=<hex>
                 └─ 10s timeout, single attempt (Inngest retries the whole function)
```

If Inngest is unavailable, `post-call.ts` falls back to direct HTTP POST to `/api/internal/post-call` (signed via `INTERNAL_API_SECRET`), which calls `deliverLead` itself.

---

## Plan-Aware Quota (Phase 3)

```
POST /api/public/agent/{slug}/session
  → checkSessionRateLimit (Upstash sliding window — IP + slug)
  → checkBusinessPlanQuota
       resolvePlan(businessId)            ← Subscription || free fallback
       SUM(AgentSession.duration WHERE businessId AND createdAt >= periodStart)
       429 if over plan.monthlyMinutes * 60
  → create AgentSession with updateToken
```

Side hook on PATCH: `recordBusinessSessionUsage` → `notifyQuotaThresholds` (fire-and-forget) checks 80/95/100% crossing and emails the owner. `Subscription.lastQuotaNotice` only advances forward — same threshold in same period is a no-op.

`enforceAgentLimit(businessId)` is called from `POST /api/business/[businessId]/agents` — gates agent creation against `plan.maxAgents`.

---

## Stripe (Phase 3)

| Endpoint | Purpose |
|---|---|
| `POST /api/billing/checkout` | Creates Checkout Session, returns `{ url }`. Metadata round-trips `{ businessId, planId }`. |
| `POST /api/billing/portal`   | Customer portal for plan changes / cancel. Requires existing `stripeCustomerId`. |
| `POST /api/billing/webhook`  | Signature-verified. Handles `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.payment_failed`. |

Without `STRIPE_SECRET_KEY` set, all three endpoints return 503 and the billing UI hides Upgrade buttons (Free tier still works because `resolvePlan` falls back to Free when no `Subscription` row exists).

To turn on real Stripe in prod:
1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`.
2. Re-run `node prisma/seed-plans.mjs` (it picks up the price IDs from env).
3. Configure the webhook in the Stripe dashboard for the four events above.

---

## API Route Patterns

```typescript
// Owner-protected (auth required)
const session = await auth();
if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// then verify ownership of the businessId / agentId / sessionId

// Anonymous public (no auth, but rate-limited)
// /api/public/agent/[slug]/...
// Session PATCH requires Bearer token issued at creation:
//   Authorization: Bearer <updateToken>   OR  x-session-token: <updateToken>

// Internal server-to-server
// Header required: x-internal-secret: $INTERNAL_API_SECRET
// /api/internal/post-call

// Stripe webhook
// stripe-signature header verified via stripe.webhooks.constructEvent
// /api/billing/webhook
```

---

## Key Conventions

- **Imports**: Always use `@/` alias (maps to `src/`); never relative paths across feature dirs.
- **Prisma**: Import `prisma` from `@/lib/db`, never from `@prisma/client` directly.
- **Auth**: `auth()` from `@/lib/auth` in server code; `useSession()` in client.
- **Server vs Client**: Server by default; add `"use client"` only for hooks / events / browser APIs.
- **Template config**: Validate against `TEMPLATES` array in `templates.ts` — single source of truth.
- **shadcn**: `npx shadcn@latest add <component>` lands in `src/components/ui/`.
- **Schema changes**: After editing `schema.prisma`, **always** `npx prisma generate && npx prisma db push` immediately, before writing code that uses new models.
- **System prompt rule**: Every SMB agent prompt has the `leadCaptureRule` appended automatically (in `agent-prompts.ts:getAgentSystemPrompt`). Don't claim agents can book/order — they can only capture leads.

---

## Required Environment Variables

```
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=               # http://localhost:3000 in dev
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI
GOOGLE_GEMINI_API_KEY=      # Voice + embeddings (gemini-embedding-001)
ANTHROPIC_API_KEY=          # Post-call Claude analysis

# Internal (MANDATORY — server fails closed without this)
INTERNAL_API_SECRET=        # `openssl rand -hex 32`

# Email
RESEND_API_KEY=             # Lead notifications, quota warnings, verify-email

# Rate limiting (optional in dev — silent fallback if unset)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Background jobs (optional in dev — falls back to direct HTTP)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Billing (optional — Free tier works without; paid plans require all four)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=

# Observability (optional)
LANGSMITH_API_KEY=
LANGSMITH_TRACING_V2=true
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

---

## Gotchas

- **Next.js 16 breaking changes** — APIs differ from training data. Before any Next.js work, check `node_modules/next/dist/docs/`.
- **Turbopack stale cache** — After multi-step schema migrations, Turbopack occasionally stops registering route changes. If a route mysteriously 404's after schema work: stop the dev server, `rm -rf .next`, restart.
- **Neon HTTP adapter** — `prisma.$transaction()` has limitations; prefer individual sequential queries.
- **pgvector raw SQL** — Vector columns can't use standard Prisma query builders; see `src/lib/rag.ts` for the parameterized pattern (it IS safe — `$executeRawUnsafe` with `$1`/`$2` bindings is parameterized, not interpolated).
- **AudioWorklet** — Must be at `public/audio-capture-worklet.js` (served at `/audio-capture-worklet.js`). Never import as an ES module.
- **Session save on browser close** — Uses `beforeunload` + `keepalive: true` fetch. Do not introduce `async` logic here.
- **Embedding model** — Use `gemini-embedding-001` with `config: { outputDimensionality: 768 }` and the **default** API version (the explicit `apiVersion: "v1"` override breaks this model). The `KnowledgeItem.embedding` column is `vector(768)`.
- **LangSmith** — Wrap Claude/embedding calls with `wrapTraced()` from `src/lib/langsmith.ts`.
- **Cross-origin iframe mic** — The host site's `<iframe>` MUST include `allow="microphone"` or `getUserMedia` is blocked. Snippet in `EmbedInstallCard` already includes it.
- **Stripe webhook body** — Must be read as raw bytes BEFORE JSON parsing for signature verification. The webhook route uses `request.text()` then `stripe.webhooks.constructEvent`.
- **`contextWindowCompression` token counts are STRINGS** — `triggerTokens` and `slidingWindow.targetTokens` are typed as `string`, not `number`, in the `@google/genai` SDK (protobuf int64 convention). Pass them as `"16000"`, not `16000`. Same for any other int64 fields.
- **Lead delivery idempotency** — `leadDeliveredAt` is stamped after the email send (so a transient Resend failure can still retry) but BEFORE the webhook send (so a flaky receiver doesn't cause email duplication on retry). Consequence: webhook receivers should expect at-most-once delivery on first attempt + at-least-once on Inngest retry.
