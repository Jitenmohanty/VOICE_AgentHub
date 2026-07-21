# Voxie — Setup & Verification Guide

A do-it-yourself walkthrough of **every platform account you need to create**, **how to wire each one up**, and **a concrete test to prove it works** before you move on.

This is the hands-on companion to `README.md` (reference) and `PRODUCT_FLOW.md` (runtime internals). Follow it top-to-bottom the first time; after that, use it as a checklist.

---

## How Voxie is layered

Every external service is **Stripe-style gated**: leave its env vars unset and that feature is silently disabled — **nothing else breaks**. So you don't need everything at once. Set up in tiers:

| Tier | What you get | Platforms |
|------|--------------|-----------|
| **1 — Boot** | App runs, you can make a voice call and get an AI-scored lead | Neon, Google Gemini, Anthropic |
| **2 — Real deployment** | Emails delivered, social login, rate limits, durable jobs | Resend, Google/GitHub OAuth, Upstash, Inngest |
| **3 — Monetize & channels** | Billing, WhatsApp, calendar booking, CRM, recording, observability | Stripe, Razorpay, WhatsApp BSP, Cloudflare R2, Sentry, LangSmith |

You can ship Tier 1 today and switch on Tier 2/3 features one at a time.

---

## 0. Prerequisites

- **Node.js 20+** — `node -v`
- **Git** — to clone the repo
- **`openssl`** — for generating secrets (bundled with Git Bash on Windows)

```bash
git clone <repo-url>
cd VOICE_AgentHub
npm install
cp .env.example .env.local
```

> ⚠️ **`.env` vs `.env.local` gotcha.** `npm run dev` and `npm run build` read **both** files, but **`npm run eval` reads only `.env.local`** (it's launched with `tsx --env-file=.env.local`). Put your keys in **`.env.local`** to avoid surprises. If you keep a `.env`, make sure the AI keys are also in `.env.local` or the eval harness won't see them.

Generate the three local secrets now (they aren't from any platform):

```bash
openssl rand -hex 32   # → NEXTAUTH_SECRET
openssl rand -hex 32   # → INTERNAL_API_SECRET   (MANDATORY — server fails closed without it)
openssl rand -hex 32   # → SECRETS_ENCRYPTION_KEY (only needed for CRM / calendar later)
```

Set in `.env.local`:

```env
NEXTAUTH_SECRET=<paste>
NEXTAUTH_URL=http://localhost:3000
INTERNAL_API_SECRET=<paste>
```

---

# TIER 1 — Boot the core loop

## 1.1 Neon (PostgreSQL + pgvector) — **required**

**Powers:** all data (users, agents, sessions, leads) and RAG vector search.

**Set up:**
1. Sign up at **https://neon.tech** → create a project (pick a region close to you).
2. In the project, open **SQL Editor** and enable pgvector once:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy the **pooled** connection string (Dashboard → Connection Details → "Pooled connection", `...-pooler...`).

```env
DATABASE_URL=postgresql://<user>:<pass>@ep-xxxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require
```

4. Create the tables and seed the billing plans:
   ```bash
   npx prisma generate
   npx prisma db push          # creates every table (no migration files)
   node prisma/seed-plans.mjs  # seeds Free / Starter / Pro (idempotent)
   ```

**✅ Test:**
```bash
npx prisma studio    # opens a GUI at http://localhost:5555
```
You should see tables (`User`, `Business`, `Agent`, `BillingPlan` with 3 rows, …). If `db push` errored on the vector type, step 2 wasn't run.

---

## 1.2 Google Gemini API — **required**

**Powers:** real-time voice (Gemini Live), text embeddings for RAG, and the WhatsApp text agent.

**Set up:**
1. Go to **https://aistudio.google.com/apikey** → **Create API key**.
2. Add it:
   ```env
   GOOGLE_GEMINI_API_KEY=<key>
   ```

> This is a **Google AI Studio** key, *not* the Google OAuth client from §2.1 — different thing, both from Google.

**✅ Test:**
```bash
npm run dev
```
- Open http://localhost:3000, register (see §1.4), create an agent, then open its public page `/a/<slug>` and click **Start Call**. Allow the mic and speak — the agent should respond in voice.
- **Embeddings test:** in the dashboard add a Knowledge item; within a few seconds its `embeddingStatus` should flip to `ready` (check in Prisma Studio → `KnowledgeItem`). `failed` means the key is wrong or lacks embedding access.

---

## 1.3 Anthropic (Claude) — **required**

**Powers:** post-call analysis (summary, sentiment, action items), AI lead scoring, weekly digests, and the eval harness.

**Set up:**
1. Sign up at **https://console.anthropic.com** → **API Keys** → create a key. Add billing credit.
2. Add it:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```

**✅ Test:** Complete a voice call and hang up. Within ~30s the session should gain a `summary`, `sentiment`, and `leadScore` (check Prisma Studio → `AgentSession`, or the Leads inbox). Nothing appears → key/credit problem, or Inngest isn't running (see §2.4 — in dev it falls back to a direct HTTP call, so it still works without Inngest).

---

## 1.4 Auth to log in (no external platform needed)

Voxie supports **email/password (Credentials)** out of the box — you do **not** need OAuth to start.

**✅ Test:** Go to `/register`, create an account, then `/login`. (Email verification uses Resend — see §2.1; in dev without Resend, verify the user manually by setting `emailVerified` in Prisma Studio.)

> ✅ **Tier 1 done** = you can register, build an agent, make a voice call, and see an AI-scored lead. Everything below is optional and additive.

---

# TIER 2 — Production-ready

## 2.1 Resend (email) — recommended

**Powers:** lead-notification emails, verify-email, password reset, quota warnings, digests.

**Set up:**
1. Sign up at **https://resend.com** → **API Keys** → create one.
2. For real delivery, verify a sending domain (Domains → add DNS records). Without a verified domain you can only send to your own address / use the dev Gmail fallback below.
   ```env
   RESEND_API_KEY=re_...
   ```
3. **Dev-only Gmail fallback** (delivers anywhere without a Resend domain): create a Gmail **App Password** (Google Account → Security → 2-Step Verification → App passwords) and set:
   ```env
   GMAIL_SENDER=you@gmail.com
   GMAIL_APP_PASSWORD=<16-char app password>
   ```

**✅ Test:** Register a new user → you should receive the verify-email. Or complete a call that captures a lead → the notification email lands in the business `notificationEmail`.

---

## 2.2 Google OAuth — optional (social login + calendar reuse)

**Powers:** "Sign in with Google", and later the Google Calendar booking feature reuses the *same* OAuth app.

**Set up:**
1. **https://console.cloud.google.com** → create a project → **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
2. Authorized redirect URIs — add both:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/integrations/google-calendar/callback` (for §3.4 later)
3. Add production equivalents (`https://your-domain/...`) when you deploy.
   ```env
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```

**✅ Test:** `/login` → **Continue with Google** → you land back logged in. `redirect_uri_mismatch` means the URI in step 2 doesn't exactly match.

---

## 2.3 GitHub OAuth — optional

**Set up:**
1. **https://github.com/settings/developers** → **New OAuth App**.
2. **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`.
3. Generate a client secret.
   ```env
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

**✅ Test:** `/login` → **Continue with GitHub** → logged in.

---

## 2.4 Upstash Redis (rate limiting) — optional in dev

**Powers:** sliding-window rate limits on session creation, auth, resume-parse, and `search-knowledge`.

**Set up:**
1. **https://upstash.com** → create a **Redis** database → copy the **REST** URL and token (not the `redis://` URL).
   ```env
   UPSTASH_REDIS_REST_URL=https://<name>.upstash.io
   UPSTASH_REDIS_REST_TOKEN=<token>
   ```

> Unset = rate limiting is skipped (fails open) and you'll see no errors. A **dead/expired** instance, however, logs `ENOTFOUND ...upstash.io` on every request — if you see that, either paste a live instance or comment these two lines out.

**✅ Test:** Set both, restart, and hit `POST /api/public/agent/<slug>/session` >10×/min from one IP → the 11th returns **429**. No `ENOTFOUND` in the dev console = healthy.

---

## 2.5 Inngest (durable background jobs) — optional in dev

**Powers:** the durable post-call pipeline (Claude analysis → lead email → webhook) with retries. In dev, if unset, `post-call.ts` falls back to a **direct HTTP call**, so leads still process — you just lose retries/durability.

**Set up (local):**
```bash
npx inngest-cli@latest dev    # starts the local Inngest dev server + dashboard
```
No env vars needed locally. For production, create an app at **https://inngest.com** and set:
```env
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

**✅ Test:** With the dev server running, complete a call → open the Inngest dashboard (http://localhost:8288) → you should see `session/post-call` execute its steps: `fetch-session → generate-analysis → save-analysis → deliver-lead-email`.

---

# TIER 3 — Monetization, channels & ops (all optional)

> For each of these, the platform env just makes the feature **available**; the owner still flips a per-agent/per-business toggle in the dashboard. After setting Stripe/Razorpay IDs, **re-run `node prisma/seed-plans.mjs`**.

## 3.1 Stripe (international billing, USD)

**Set up:**
1. **https://dashboard.stripe.com** → in **Test mode**, create two recurring **Products/Prices** (Starter, Pro). Copy their **Price IDs** (`price_...`).
2. Get your **Secret key** (Developers → API keys).
3. Webhook: Developers → Webhooks → add endpoint `https://your-domain/api/billing/webhook`, events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy the **signing secret** (`whsec_...`).
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_STARTER=price_...
   STRIPE_PRICE_PRO=price_...
   ```
4. `node prisma/seed-plans.mjs` (so plans pick up the price IDs).

**Local webhook testing:**
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

**✅ Test:** Dashboard → Billing → upgrade to Starter → complete checkout with card **4242 4242 4242 4242**, any future date/CVC → a `Subscription` row appears with `status=active` and the usage gauge reflects the new plan.

---

## 3.2 Razorpay (India billing, INR + UPI links)

**Set up:**
1. **https://dashboard.razorpay.com** (Test mode) → create two **Plans** (monthly, INR). Copy their **Plan IDs** (`plan_...`).
2. Settings → API Keys → generate Key ID + Secret.
3. Webhook: `https://your-domain/api/billing/razorpay/webhook`, events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.paused`, `payment.failed`, and `payment_link.paid` (for UPI links). Set a webhook secret.
   ```env
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=<your webhook secret>
   RAZORPAY_PLAN_STARTER=plan_...
   RAZORPAY_PLAN_PRO=plan_...
   ```
4. `node prisma/seed-plans.mjs`.

**Local webhook testing:** Razorpay has no CLI — expose your port with a tunnel:
```bash
cloudflared tunnel --url http://localhost:3000    # or: ngrok http 3000
```
Point the webhook URL at the tunnel host.

**✅ Test:** Billing page (INR) → subscribe → complete the hosted checkout in test mode → `subscription.activated` hits the webhook and the `Subscription` row shows `paymentProvider=razorpay`.

> Amounts are in **paise** (1 INR = 100 paise) — `priceInrPaise` × display logic already handles this.

---

## 3.3 WhatsApp channel (Gupshup or Twilio)

**Powers:** outbound lead confirmations + a full inbound WhatsApp text agent.

**Set up (Gupshup example):**
```env
WHATSAPP_BSP_PROVIDER=gupshup
WHATSAPP_BSP_API_KEY=...
WHATSAPP_BSP_SOURCE_NUMBER=<digits, country code, no +>
WHATSAPP_BSP_APP_NAME=...
WHATSAPP_INBOUND_TOKEN=<openssl rand -hex 32>   # fails closed if unset
```
Point your BSP's inbound webhook at:
`https://your-domain/api/whatsapp/inbound?token=<WHATSAPP_INBOUND_TOKEN>`
(Twilio: use `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` instead.)

**✅ Test:** Send a WhatsApp message to your business number → a `WhatsAppConversation` thread appears in the dashboard and the agent replies.

---

## 3.4 Google Calendar booking

**Powers:** real slot lookup + event creation mid-call. Reuses the Google OAuth app from §2.2.

**Set up:**
1. Ensure `SECRETS_ENCRYPTION_KEY` is set (OAuth tokens are stored AES-256-GCM encrypted).
2. Confirm the redirect URI `.../api/integrations/google-calendar/callback` is in your Google OAuth app (§2.2 step 2).

**✅ Test:** Settings → **Connect Google Calendar** → grant access → make a call and ask to book; a real event appears on your calendar. Without it, the agent gracefully falls back to `captureLead`.

---

## 3.5 Zoho CRM push

```env
SECRETS_ENCRYPTION_KEY=<already set>
```
**✅ Test:** Settings → paste Zoho credentials → **Test connection** button returns success; a captured lead then pushes to Zoho (idempotent).

---

## 3.6 Cloudflare R2 (call recording storage)

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=<private bucket>
```
> ⚠️ **Not fully wired.** Storage, consent, upload, presigned playback, and 30-day retention are built, but the ~20 lines that start the recorder on the caller's device are intentionally **not** hooked up (needs a real-mic test). See `ROADMAP_NEXT.md` → Item 12. Until then the recording toggle is inert.

---

## 3.7 Observability — LangSmith + Sentry (optional)

```env
LANGSMITH_API_KEY=...
LANGSMITH_TRACING_V2=true
LANGSMITH_PROJECT=agenthub
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...        # source-map upload at build only
```
**✅ Test:** After a call, LangSmith shows traces for `deliverLead`, `searchKnowledgeDispatch`, etc.

---

# Final smoke test (end-to-end)

Run this sequence once everything you want is configured:

```bash
# 1. Clean production build (catches type/build errors)
npm run build

# 2. Baseline the AI agents (needs GOOGLE_GEMINI_API_KEY + ANTHROPIC_API_KEY in .env.local)
npm run eval                 # exits 1 on regressions; `npm run eval -- hotel` for one template

# 3. Dev server + Inngest
npm run dev
npx inngest-cli@latest dev   # separate terminal
```

Then, in the browser:
1. Register → log in.
2. Complete onboarding → create an agent → add a Knowledge item (confirm `embeddingStatus=ready`).
3. Open `/a/<slug>` → **Start Call** → have a short conversation → hang up.
4. Confirm within ~30s: session gets `summary` + `leadScore`; a lead email arrives; the lead shows in `/business/leads`.
5. (If billing set) Upgrade a plan with a test card and confirm the `Subscription` row + usage gauge.

If all five pass, the platform is correctly set up.

---

## Production (Vercel) notes

- Set **every** env var you use in the Vercel project settings (not just `.env.local`).
- `INTERNAL_API_SECRET` is **mandatory** in prod or post-call analysis 500s.
- Swap all `http://localhost:3000` redirect URIs / webhook URLs for your real domain in Google, GitHub, Stripe, Razorpay, and the WhatsApp BSP.
- **Re-run `node prisma/seed-plans.mjs`** against the prod DB after setting Stripe/Razorpay IDs.
- `NEXTAUTH_URL` must be your production URL.

---

## Quick reference — what each platform unlocks

| Platform | Tier | Env vars | Unset behavior |
|----------|------|----------|----------------|
| Neon | 1 | `DATABASE_URL` | App can't run |
| Google Gemini | 1 | `GOOGLE_GEMINI_API_KEY` | Voice + RAG fail |
| Anthropic | 1 | `ANTHROPIC_API_KEY` | No analysis/scoring/eval |
| Resend | 2 | `RESEND_API_KEY` (+ Gmail fallback) | No emails sent |
| Google OAuth | 2 | `GOOGLE_CLIENT_ID/SECRET` | Google login hidden |
| GitHub OAuth | 2 | `GITHUB_CLIENT_ID/SECRET` | GitHub login hidden |
| Upstash | 2 | `UPSTASH_REDIS_REST_URL/TOKEN` | Rate limiting skipped |
| Inngest | 2 | `INNGEST_EVENT_KEY/SIGNING_KEY` | Direct-HTTP fallback |
| Stripe | 3 | `STRIPE_*` (4) | Stripe routes 503 |
| Razorpay | 3 | `RAZORPAY_*` (5) | Razorpay routes 503 |
| WhatsApp | 3 | `WHATSAPP_*` | Channel off |
| Calendar | 3 | (Google OAuth) + `SECRETS_ENCRYPTION_KEY` | Falls back to captureLead |
| Zoho CRM | 3 | `SECRETS_ENCRYPTION_KEY` | CRM push off |
| R2 recording | 3 | `R2_*` (4) | Recording off (also not fully wired) |
| LangSmith / Sentry | 3 | `LANGSMITH_*` / `SENTRY_*` | No tracing / no source maps |

See `README.md` for the reference list and `PRODUCT_FLOW.md` for what fires at runtime.
