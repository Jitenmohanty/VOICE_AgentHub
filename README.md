# Voxie — Multi-Tenant Voice AI Platform

> Build, deploy, and monetize AI voice agents for any small business. Powered by Gemini Live, Claude, RAG, and Stripe.

Voxie lets **business owners** create AI voice agents trained on their own data — menus, room inventory, policies, FAQs — and embed them into their existing website as a widget. Visitors talk to the AI; the AI answers from real business data; captured leads land in the owner's inbox (or Slack, or Zapier) within seconds. No AI expertise required.

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
| **Phase 6** — Razorpay + hardening | Razorpay subscriptions alongside Stripe (Indian SMB market): hosted checkout via short_url, HMAC-SHA256-signed webhook handling `subscription.{activated,charged,cancelled,completed,paused}` + `payment.failed`; dual-provider billing UI with currency-aware display (USD / INR); per-business `paymentProvider` field; INR plan pricing seeded (₹2399 / ₹7999 / Free); IP rate-limit on `/search-knowledge` (30/min); `robots.ts` + `sitemap.ts` for SEO basics | ✅ |
| **Phase 7** — Dashboard depth + AI lead scoring | Analytics page (KPIs, calls/day chart, sentiment breakdown, top topics — 7/30/90d); Lead inbox (`/business/leads`) with status tabs, search, agent filter, CSV export; team management (`BusinessMember` + single-use email invites, owner-gated mutations); webhook delivery log (`WebhookDelivery` rows + settings UI); `personal` portfolio agent template; resume PDF parsing (Claude) for interview candidates; **AI lead scoring** — Claude post-call now also returns `leadScore` (0-100), `intentCategory` (booking/pricing/support/complaint/information/spam/other), and a `suggestedReply` follow-up draft; lead inbox gains "Hot leads first" sort + score/intent pills; CSV export includes both columns | ✅ |
| **Phase 8** — Omnichannel + transactions + reliability (ROADMAP_NEXT.md Items 1–13) | Website-URL → auto-built knowledge base (crawler + Claude chunking); knowledge-gap detection + weekly AI digest email; WhatsApp outbound confirmations AND a full inbound WhatsApp text agent (same brain, `WhatsAppConversation` threads, human takeover); Hindi/code-switching language mirroring; **Google Calendar booking** (real slots + events mid-call, OAuth + AES-encrypted tokens, captureLead fallback); **mid-call UPI payment links** (per-agent toggle + ₹ cap, `payment_link.paid` webhook); **Zoho CRM push** (encrypted creds, test button, idempotent delivery step); WebSocket reconnect via session resumption (mic buffered through blips); metered overage billing (opt-in soft cap, monthly Razorpay invoice cron); call-recording infrastructure (R2 SigV4, consent-first, presigned playback); eval harness (`npm run eval` — Claude personas incl. prompt-injection vs. real prompts, Claude judge, CI exit code). **Pipeline-completion pass:** lead email + webhook now carry `leadScore`/`intentCategory`/`suggestedReply` (🔥 subject prefix for hot leads); CRM status + manual re-push in session detail (`POST /api/sessions/[id]/crm-push`); booked-appointment + payment badges; 30-day recording-retention cron; WhatsApp chats tile on the agent page; `.env.example` added | ✅ |
| **Phase 9+** — Future | Recording wiring in `PublicAgentExperience` (steps in ROADMAP_NEXT.md — needs a live-mic test); audio PII redaction; per-agent webhook overrides; multi-business per owner (schema allows it, UI assumes `businesses[0]`); dedicated webhook retry queue with dead-letter UI; LeadSquared/Kylas CRM adapters; Calendly; LangGraph if booking flows grow states | Planned |

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
      ├── BusinessMember (userId, role="member")   ← team access; owner stays on Business.ownerId
      ├── BusinessInvite (email, unique token, 7-day expiry, acceptedAt)
      ├── WebhookDelivery (sessionId, statusCode, latencyMs, ok, errorMessage)  ← one row per webhook attempt
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
                ├── leadScore (0-100), intentCategory, suggestedReply  (Claude AI lead scoring)
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
│   └── functions/               post-call-analysis, ingest-website, weekly-digest,
│                                overage-invoice, recording-retention
├── lib/
│   ├── agents/                  Per-template prompt + tool definitions (incl. personal)
│   ├── gemini/                  live-session (reconnect + recording tap), agent-prompts
│   │                            (captureLead, searchKnowledge, booking, payment tools + rules)
│   ├── calendar/                Google Calendar booking: OAuth state, free/busy → slots, events
│   ├── crm/                     Zoho adapter + pushLeadToCrm dispatcher
│   ├── whatsapp/                BSP adapters (gupshup/twilio) + inbound text-agent engine
│   ├── payments/                Razorpay payment links (mid-call UPI + overage invoices)
│   ├── storage/r2.ts            Cloudflare R2 via dependency-free SigV4 (put/presign/delete)
│   ├── recording/               CallRecorder (mic + agent mix → webm/opus → upload)
│   ├── ingest/                  Website crawler (SSRF-guarded) + Claude chunking pipeline
│   ├── crypto.ts                AES-256-GCM secrets-at-rest (SECRETS_ENCRYPTION_KEY)
│   ├── auth.ts                  NextAuth config
│   ├── claude.ts                Post-call analyzer + lead scoring + interview reports + digests
│   ├── db.ts                    Prisma (Neon HTTP adapter)
│   ├── embeddings.ts            gemini-embedding-001, 768-dim
│   ├── rag.ts                   pgvector cosine search + generateAndStoreEmbedding
│   ├── ratelimit.ts             Upstash limiters + plan quota + overage soft-cap
│   ├── stripe.ts / razorpay.ts  Billing provider clients
│   ├── lead-delivery.ts         Email + webhook + CRM + WhatsApp orchestrator (idempotent)
│   ├── email.ts                 Resend templates (welcome, verify, lead, quota, digest, overage)
│   ├── post-call.ts             Inngest trigger + HTTP fallback
│   ├── templates.ts             Industry template definitions (+ Payments config fields)
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

# ── Billing (Stripe — international) ──────────
STRIPE_SECRET_KEY=               # If unset: Stripe routes return 503; Razorpay or Free tier still work
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=            # Stripe Price ID for the Starter plan
STRIPE_PRICE_PRO=                # Stripe Price ID for the Pro plan

# ── Billing (Razorpay — India / INR) ──────────
RAZORPAY_KEY_ID=                 # Same gating as Stripe — unset disables Razorpay only
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_STARTER=           # Razorpay Plan ID for the Starter plan
RAZORPAY_PLAN_PRO=               # Razorpay Plan ID for the Pro plan

# ── WhatsApp channel (optional — Items 4 + 5) ──
# Unset = WhatsApp channel silently disabled (Stripe-style gating).
WHATSAPP_BSP_PROVIDER=           # gupshup | twilio
WHATSAPP_BSP_API_KEY=            # Gupshup API key
WHATSAPP_BSP_SOURCE_NUMBER=      # Gupshup WhatsApp Business number (digits, country code, no +)
WHATSAPP_BSP_APP_NAME=           # Gupshup app name
TWILIO_ACCOUNT_SID=              # Twilio alternative
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=            # E.164, e.g. +14155238886
# Inbound text agent (Item 5): point the BSP webhook at
#   https://your-domain/api/whatsapp/inbound?token=$WHATSAPP_INBOUND_TOKEN
WHATSAPP_INBOUND_TOKEN=          # `openssl rand -hex 32` — fails closed if unset

# ── Integration secrets at rest (Item 9 CRM + Item 7 calendar) ──
SECRETS_ENCRYPTION_KEY=          # `openssl rand -hex 32` — AES-256-GCM; CRM/calendar connect return 503 without it

# ── Google Calendar booking (Item 7) reuses GOOGLE_CLIENT_ID/SECRET above.
# One-time setup: add {APP_URL}/api/integrations/google-calendar/callback
# as an authorized redirect URI in the Google Cloud console.

# ── Call recording storage (Item 12) — Cloudflare R2. Unset = recording off.
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=                       # private bucket; playback via presigned URLs only

# ── Observability ─────────────────────────────
LANGSMITH_API_KEY=               # Optional
LANGSMITH_TRACING_V2=true
SENTRY_ORG=                      # Optional, source-map upload only
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

> **Production checklist**:
> - Set `INTERNAL_API_SECRET` in your hosting env (Vercel) or post-call analysis will 500.
> - **Stripe** (international): set the four `STRIPE_*` vars; add `https://your-domain/api/billing/webhook` to your Stripe dashboard listening for `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.payment_failed`.
> - **Razorpay** (India): set the five `RAZORPAY_*` vars; create monthly Plans in the Razorpay dashboard and copy their IDs into `RAZORPAY_PLAN_STARTER` / `RAZORPAY_PLAN_PRO`; add `https://your-domain/api/billing/razorpay/webhook` listening for `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.paused`, `payment.failed`.
> - **After setting Stripe / Razorpay env vars, re-run** `node prisma/seed-plans.mjs` so plans pick up the new price/plan IDs.
> - Add `https://your-domain/api/auth/callback/google` to Google OAuth's authorized redirect URIs.

---

## Scripts

```bash
npm run dev                # Next.js dev (Turbopack)
npm run build              # Production build
npm run lint               # ESLint
npm run start              # Production server
npm run eval               # Voice-agent eval harness — Claude caller personas
                           # (incl. prompt injection) vs. real prompts, Claude judge.
                           # Needs GOOGLE_GEMINI_API_KEY + ANTHROPIC_API_KEY. Exits 1 on failures.
                           # `npm run eval -- hotel` for one template.

npx prisma db push         # Push schema to Neon (no migration files)
npx prisma generate        # Regenerate Prisma client after schema changes
npx prisma studio          # GUI for inspecting the database

node prisma/seed-plans.mjs # Upsert the three billing plans (idempotent)
```

---

## Operating Voxie (what you, the owner, need to know)

### Every advanced feature is off until you configure it

Voxie boots and runs the **core loop (voice call → captured lead → email + AI scoring)**
with just the required env vars. Every integration below is *gated the same way as
Stripe* — leave its env unset and that feature is silently disabled; nothing else
breaks. So you can ship the core today and switch features on one at a time.

| Feature | Turns on when you set | Extra dashboard step |
|---|---|---|
| AI lead scoring, digests, evals | `ANTHROPIC_API_KEY` (already required) | — |
| Website → auto knowledge base | required keys only | — |
| Stripe billing (USD) | `STRIPE_*` (4 vars) | Webhook → `/api/billing/webhook` |
| Razorpay billing (INR) | `RAZORPAY_*` (5 vars) | Webhook → `/api/billing/razorpay/webhook` |
| WhatsApp outbound + inbound agent | `WHATSAPP_BSP_*` + `WHATSAPP_INBOUND_TOKEN` | BSP webhook → `/api/whatsapp/inbound?token=…` |
| Google Calendar booking | `GOOGLE_CLIENT_*` (already set) + `SECRETS_ENCRYPTION_KEY` | Redirect URI → `/api/integrations/google-calendar/callback`; owner clicks **Connect** in Settings |
| UPI payment links (mid-call) | `RAZORPAY_*` | Razorpay webhook must include `payment_link.paid`; owner enables per-agent + sets ₹ cap |
| Zoho CRM push | `SECRETS_ENCRYPTION_KEY` | Owner pastes Zoho creds in Settings, clicks **Test connection** |
| Metered overage billing | `RAZORPAY_*` | Owner opts in per-business in Settings |
| Call recording | `R2_*` (4 vars) | Owner enables in Settings *(see caveat below)* |

Per-agent toggles (payments, overage, recording, WhatsApp sender) live in the owner
dashboard — the platform env just makes each feature *available* to enable.

### Go-live checklist (in order)

1. `cp .env.example .env.local` and fill the **required** blocks (database, auth, AI, `INTERNAL_API_SECRET`).
2. `npx prisma generate && npx prisma db push` — **mandatory**; the app selects columns that don't exist until you do this.
3. `node prisma/seed-plans.mjs` — seeds Free/Starter/Pro (+ overage rates). Re-run after adding Stripe/Razorpay IDs.
4. `npm run build` to confirm a clean production build, then deploy (Vercel).
5. Add any providers you want from the table above, one at a time, and smoke-test each (the CRM card has a **Test connection** button; make one ₹1 payment link; connect a calendar and book a test slot).
6. `npm run eval` once your AI keys are live — baselines agent behavior; run it before any future prompt change.

### Two things deliberately NOT finished (by design)

- **Call recording capture** — storage, consent flag, upload/playback, and 30-day
  retention are all built, but the ~20 lines that start the recorder on the caller's
  device (`PublicAgentExperience.tsx`) are **not wired**, because that's the live-call
  hot path and must be tested with a real microphone, not shipped blind. Exact steps
  are in `ROADMAP_NEXT.md` → Item 12. Until then, the recording toggle is inert.
- **Audio PII redaction** — a separate project (needs word-level transcript timestamps).

### Where your money & leads actually flow

- **Leads**: every call → `AgentSession` → Claude scores it → email to you (hot leads get a
  🔥 subject) + optional signed webhook + optional Zoho + optional WhatsApp confirmation. All
  idempotent; see `PRODUCT_FLOW.md`.
- **Money in**: subscriptions via Stripe/Razorpay; mid-call UPI deposits via payment links;
  month-end overage auto-invoiced by the `overage-invoice` cron.
- **Full runtime walkthrough**: `PRODUCT_FLOW.md`. **AI internals**: `AI_PIPELINE.md`.
  **Next ideas + status**: `ROADMAP_NEXT.md`.

---

## License

Private project — not open source.
