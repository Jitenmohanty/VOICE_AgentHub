# AgentHub — Multi-Tenant Voice AI Platform

> Build, deploy, and monetize AI voice agents for any small business. Powered by Gemini Live, Claude, RAG, and Stripe.

AgentHub lets **business owners** create AI voice agents trained on their own data — menus, room inventory, policies, FAQs — and embed them into their existing website as a widget. Visitors talk to the AI; the AI answers from real business data; captured leads land in the owner's inbox (or Slack, or Zapier) within seconds. No AI expertise required.

> 📄 Companion docs:
> - **[`PRODUCT_FLOW.md`](./PRODUCT_FLOW.md)** — end-to-end runtime walkthrough (what fires when a caller clicks "Start Call," how the lead reaches the owner, how billing enforces quotas).
> - **[`AI_PIPELINE.md`](./AI_PIPELINE.md)** — internals of the AI stack: how the system prompt is assembled, the per-agent Gemini Live tuning, dynamic RAG, post-call Claude pipeline, LangSmith tracing coverage, and what we deliberately *don't* use (LangChain, LangGraph).

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                  CALLER (anonymous)                              │
│  Clicks the embedded widget on the owner's website               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│       /embed/{slug}  ←  iframe with frame-ancestors *            │
│       Same UI as /a/{slug}, no header chrome                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            GEMINI LIVE API  (real-time WebSocket voice)          │
│  System prompt = template + business data + RAG context          │
│  Tools = info getters (listRooms, getMenu, …) + captureLead      │
└──────────┬──────────────────────────────────┬───────────────────┘
           │                                   │
           ▼                                   ▼
┌─────────────────────┐         ┌────────────────────────────────┐
│  pgvector (Neon)     │         │  POST /session/{id} PATCH      │
│  KnowledgeItem.      │         │  capturedLead → DB             │
│  embedding(768)      │         │  (mid-call, not at end)        │
└──────────────────────┘         └────────────────────────────────┘
                                                  │
                            Call ends, status=completed PATCH
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Inngest:  post-call-analysis (3 retries, dedupe, durable)       │
│    1. Claude Sonnet 4 → summary, sentiment, action items         │
│    2. deliverLead → Resend email to owner                        │
│    3. deliverLead → signed JSON webhook (HMAC-SHA256)            │
└─────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│   OWNER DASHBOARD (/business/*)                                  │
│   - Captured lead block + status workflow (new → won)            │
│   - Usage gauge + Stripe billing portal                          │
│   - CSV export                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Two User Types

| Role | What they do |
|------|-------------|
| **Business Owner** | Sign up → onboarding wizard → embed `<iframe>` on their site → pick a plan |
| **Caller (end customer)** | Clicks the widget, talks to the AI — **no login required** |

---

## What's shipped

| Phase | What | Status |
|---|---|---|
| **Phase 0** — Security | Mandatory `INTERNAL_API_SECRET`; per-session bearer token on PATCH; `KnowledgeItem.embeddingStatus` field | ✅ |
| **Phase 1** — Honest agents + lead delivery | Universal `captureLead` tool; transactional mock tools removed; hard "no booking lies" rule injected into every prompt; Resend email lands in owner's inbox after Claude analysis | ✅ |
| **Phase 2** — Distribution | `/embed/{slug}` widget + `frame-ancestors *` CSP scoped to `/embed/*` only; copy-paste install snippet UI; embedding model upgraded to `gemini-embedding-001` (768-dim) | ✅ |
| **Phase 3** — Monetization | `BillingPlan` + `Subscription` models (Free / Starter / Pro); plan-aware monthly quota; Stripe checkout/portal/webhook; usage gauge; 80%/95%/100% threshold emails | ✅ |
| **Phase 4** — Polish | Outbound webhook with HMAC-SHA256 signing; lead status workflow (new → contacted → qualified → won / lost / archived); CSV export; settings UI for notification email + webhook URL | ✅ |
| **Phase 5** — AI pipeline tuning | Per-agent VAD config (`silenceDurationMs` 1.2s/2s, `endOfSpeechSensitivity: LOW`); per-agent `temperature` (0.7 SMB, 0.75 interview); `enableAffectiveDialog`; sliding-window `contextWindowCompression`; `sessionResumption` handle capture; universal `searchKnowledge` tool for dynamic mid-call RAG; per-session variety seed + topic angles for interview agents (no more identical questions across sessions); LangSmith tracing on `deliverLead`, `sendLeadCaptureEmail`, `deliverWebhook`, `searchKnowledgeDispatch` | ✅ |
| **Phase 6+** — Future | WebSocket reconnect handler (resumption data is captured but the reconnect flow is unbuilt); per-agent webhook overrides; metered overage billing; audio call recording; multi-business per owner; dedicated webhook retry queue with dead-letter UI; LangGraph for real booking workflows (not needed until we add Calendly/EHR integrations) | Planned |

---

## Tech Stack

| Layer | Technology | Entry point |
|-------|------------|-------------|
| Framework | Next.js 16 App Router (Turbopack), TypeScript strict | `next.config.ts` |
| Voice AI | Gemini 3.1 Flash Live (`@google/genai`) | `src/lib/gemini/live-session.ts` |
| Post-call AI | Claude Sonnet 4 (`@anthropic-ai/sdk`) | `src/lib/claude.ts` |
| Embeddings + RAG | `gemini-embedding-001` (768d) + pgvector | `src/lib/embeddings.ts`, `src/lib/rag.ts` |
| Database | PostgreSQL on Neon, Prisma 7.6 + `@prisma/adapter-neon` | `src/lib/db.ts` |
| Auth | NextAuth v5 — JWT, Google OAuth + Credentials | `src/lib/auth.ts` |
| Background jobs | Inngest (durable retries for Claude analysis + lead delivery) | `src/inngest/` |
| Email | Resend | `src/lib/email.ts` |
| Billing | Stripe (Checkout, Customer Portal, webhooks) | `src/lib/stripe.ts` |
| Rate limit | Upstash Redis (sliding window) | `src/lib/ratelimit.ts` |
| Observability | LangSmith tracing + Sentry | `src/lib/langsmith.ts`, `sentry.*.config.ts` |
| State (client) | Zustand | `src/stores/` |
| UI | Tailwind CSS 4 + shadcn/ui + Framer Motion + Lucide | `src/components/ui/` |
| Audio | Web Audio API + AudioWorklet (16 kHz mic capture, 24 kHz playback) | `public/audio-capture-worklet.js` |

---

## Database Schema

```
User (NextAuth — credentials + OAuth)
 └── Business
      ├── slug (unique, used in /a/{slug} and /embed/{slug})
      ├── notificationEmail        ← lead-delivery destination (defaults to owner email)
      ├── webhookUrl               ← optional outbound webhook
      ├── webhookSecret            ← HMAC-SHA256 signing key (auto-generated)
      ├── Subscription (1:1)
      │     ├── planId             → BillingPlan (free | starter | pro)
      │     ├── status             active | trialing | past_due | canceled
      │     ├── stripeCustomerId / stripeSubscriptionId
      │     ├── currentPeriodStart / End
      │     └── lastQuotaNotice    none | 80 | 95 | 100  (threshold idempotency)
      └── Agent (one per business in v1, schema supports many)
           ├── templateType        hotel | medical | restaurant | legal | interview
           ├── config (JSON)       template-specific fields (hotelName, cuisineType, …)
           ├── KnowledgeItem
           │     ├── embedding     vector(768)
           │     └── embeddingStatus  pending | ready | failed
           ├── BusinessData        rooms / menu / doctors etc, JSON keyed by dataType
           └── AgentSession        ← anonymous callers, no User FK
                ├── updateToken    32-byte hex bearer token issued at creation
                ├── transcript     JSON (Phase 0/1)
                ├── capturedLead   JSON  { name, phone, email, intent, urgency, notes }
                ├── leadStatus     new | contacted | qualified | won | lost | archived
                ├── leadDeliveredAt    idempotency marker for email + webhook
                ├── summary, sentiment, sentimentScore, topics[], escalated  (Claude)
                └── rating, feedback   (caller's own rating)

BillingPlan
 ├── id              free | starter | pro
 ├── monthlyMinutes  30 | 200 | 800
 ├── maxAgents       1 | 3 | 10
 ├── priceCents      0 | 2900 | 9900
 └── stripePriceId   nullable; set via env on seeding
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  Login / Register / verify-email
│   ├── (business)/business/     Owner dashboard (auth required)
│   │   ├── dashboard/           Overview + usage gauge
│   │   ├── agents/[agentId]/    Agent config, knowledge, data, sessions
│   │   ├── billing/             Plan picker + Stripe portal
│   │   ├── settings/            Profile + lead-delivery (email + webhook)
│   │   └── onboarding/          4-step guided wizard
│   ├── a/[slug]/                Public voice agent — full-page (anonymous)
│   ├── embed/[slug]/            Iframe widget — same UI, no chrome (anonymous)
│   └── api/
│       ├── auth/                NextAuth + register + verify-email + reset-password
│       ├── billing/             checkout / portal / webhook
│       ├── business/[id]/       Owner-protected: agent config, knowledge, sessions, usage, leads/export
│       ├── public/              No-auth: agent metadata, session POST/PATCH
│       ├── sessions/            Owner-protected: session CRUD (status workflow)
│       └── internal/            Server-to-server: post-call (signed)
├── components/
│   ├── agent/                   PublicAgentExperience, AgentAvatar, TranscriptPanel, AudioVisualizer
│   ├── business/                EmbedInstallCard, MenuBuilder, DoctorRoster
│   ├── dashboard/               SessionDetailModal (with status workflow), RatingModal, BillingActions
│   ├── public/                  Per-template pre-call screens (Restaurant/Medical/Legal pre-call forms)
│   └── ui/                      shadcn/ui primitives
├── hooks/
│   ├── useGeminiLive.ts         Voice session lifecycle
│   └── useAudioStream.ts        Mic capture via AudioWorklet
├── inngest/
│   ├── client.ts
│   └── functions/post-call-analysis.ts    Claude analysis + deliverLead steps
├── lib/
│   ├── agents/                  Per-template prompt + tool definitions
│   ├── gemini/                  live-session, audio-utils, agent-prompts (universal captureLead tool)
│   ├── auth.ts                  NextAuth config
│   ├── claude.ts                Post-call analyzer + interview report generator
│   ├── db.ts                    Prisma (Neon HTTP adapter)
│   ├── embeddings.ts            gemini-embedding-001, 768-dim
│   ├── rag.ts                   pgvector cosine search + generateAndStoreEmbedding
│   ├── ratelimit.ts             Upstash limiters + plan-aware quota + threshold notifications
│   ├── stripe.ts                Stripe SDK + plan-id ↔ price-id mapping
│   ├── lead-delivery.ts         Email + webhook orchestrator (idempotent)
│   ├── email.ts                 Resend templates (welcome, verify, lead, quota warning)
│   ├── post-call.ts             Inngest trigger + HTTP fallback
│   ├── templates.ts             Industry template definitions
│   └── url.ts                   getAppUrl()
├── stores/                      Zustand stores
└── types/                       TypeScript types
prisma/
├── schema.prisma                Single source of truth
└── seed-plans.mjs               Idempotent plan upsert (Free / Starter / Pro)
public/
└── audio-capture-worklet.js     16 kHz PCM resampler (don't import as a module)
scripts/
└── embed-test.html              Manual cross-origin iframe test page
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (with pgvector extension enabled)
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### Setup

```bash
git clone <repo-url>
cd agenthub
npm install

cp .env.example .env.local      # then fill in the keys (see below)

npx prisma generate
npx prisma db push              # creates all tables
node prisma/seed-plans.mjs       # seeds Free / Starter / Pro

npm run dev                      # http://localhost:3000
```

---

## Required Environment Variables

```env
# ── Database ──────────────────────────────────
DATABASE_URL=                    # Neon Postgres connection string

# ── Auth ──────────────────────────────────────
NEXTAUTH_SECRET=                 # `openssl rand -hex 32`
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ── AI ────────────────────────────────────────
GOOGLE_GEMINI_API_KEY=           # Voice + embeddings (gemini-embedding-001, 768d)
ANTHROPIC_API_KEY=               # Post-call analysis (Claude Sonnet 4)

# ── Internal server-to-server ─────────────────
INTERNAL_API_SECRET=             # MANDATORY. `openssl rand -hex 32`. Falls closed if unset.

# ── Email (Resend) ────────────────────────────
RESEND_API_KEY=                  # Lead notifications, quota warnings, verify-email

# ── Rate limiting (Upstash Redis) ─────────────
UPSTASH_REDIS_REST_URL=          # Optional in dev — silently allows through if unset
UPSTASH_REDIS_REST_TOKEN=

# ── Background jobs (Inngest) ─────────────────
INNGEST_EVENT_KEY=               # Optional in dev — falls back to direct HTTP post-call
INNGEST_SIGNING_KEY=

# ── Billing (Stripe) ──────────────────────────
STRIPE_SECRET_KEY=               # If unset: billing routes return 503, Free tier still works
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=            # Stripe Price ID for the Starter plan
STRIPE_PRICE_PRO=                # Stripe Price ID for the Pro plan

# ── Observability ─────────────────────────────
LANGSMITH_API_KEY=               # Optional
LANGSMITH_TRACING_V2=true
SENTRY_ORG=                      # Optional, source-map upload only
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

> **Production checklist**:
> - Set `INTERNAL_API_SECRET` in your hosting env (Vercel) or post-call analysis will 500.
> - Set the four Stripe vars in your Vercel env, then **re-run** `node prisma/seed-plans.mjs` so the plans pick up the price IDs.
> - Add `https://your-domain/api/billing/webhook` to your Stripe dashboard, listening for `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.payment_failed`.
> - Add `https://your-domain/api/auth/callback/google` to Google OAuth's authorized redirect URIs.

---

## Scripts

```bash
npm run dev                # Next.js dev (Turbopack)
npm run build              # Production build
npm run lint               # ESLint
npm run start              # Production server

npx prisma db push         # Push schema to Neon (no migration files)
npx prisma generate        # Regenerate Prisma client after schema changes
npx prisma studio          # GUI for inspecting the database

node prisma/seed-plans.mjs # Upsert the three billing plans (idempotent)
```

---

## License

Private project — not open source.
