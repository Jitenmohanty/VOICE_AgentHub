# Voxie — Next Roadmap (Business + GenAI)

> Consolidated from `IMPLEMENTATION_PLAN.md` (Phases G–N), `README.md` (Phase 7+), `PRODUCT.md` future list,
> and a code audit (2026-07-06). Ordered one-by-one: each item is independently shippable.
> Two lenses on every item: **Business value** (revenue / retention / demo-winning) and
> **GenAI value** (AI-engineering depth — RAG, agents, evals, multimodal).

---

## Where we actually are (code audit vs docs)

Already shipped **beyond what the docs say**:

| Shipped in code | Doc status |
|---|---|
| `/business/analytics` page + `/api/business/[id]/analytics` | Listed as "future" in PRODUCT.md |
| `/business/leads` inbox + `/api/business/[id]/leads` | Not documented |
| Team management: `BusinessMember`, `BusinessInvite`, `/business/team`, invite APIs | IMPLEMENTATION_PLAN.md Phase M1 marked "future" |
| `WebhookDelivery` model + `/api/business/[id]/webhook-deliveries` | IMPLEMENTATION_PLAN.md Phase N2 marked "future" |
| Resume parsing `/api/public/resume/parse` + interview report route | IMPLEMENTATION_PLAN.md Phase C marked "future" |
| `personal` agent template (`src/lib/agents/personal-agent.ts`) | Not documented anywhere |

**Item 0 (below) is doc sync** — cheap, and it keeps every future AI-assisted session accurate.

Genuinely NOT built yet: WhatsApp channel, calendar booking, CRM push, phone/Twilio,
UPI mid-call payments, Hindi prompts, white-label/agency portfolio, WebSocket reconnect,
call recording, overage billing, eval harness, website-crawl onboarding, AI digest/lead scoring.

---

## Item 0 — Doc sync (½ day) ✦ hygiene — ✅ DONE (2026-07-06)

Updated `CLAUDE.md`, `README.md`, `PRODUCT_FLOW.md` to reflect analytics, leads inbox, team,
webhook-deliveries, resume parse, and the `personal` template (README "What's shipped" Phase 7 row).

---

## Wave 1 — Make the product self-selling (GenAI-heavy quick wins)

### Item 1 — Website-to-Agent auto-onboarding ✦ biggest onboarding unlock — ✅ DONE (2026-07-06)
Shipped: `src/lib/ingest/crawl.ts` (dependency-free, SSRF-guarded, ≤8 same-origin pages,
prompt-injection sanitizer), `src/lib/ingest/ingest-website.ts` (Claude `chunkDocument` with
naive-chunk fallback, duplicate-title idempotency, ≤40 items/run), Inngest fn `knowledge/ingest-website`
(inline fire-and-forget fallback when Inngest is down), owner route `POST .../knowledge/ingest-url`,
"Import from website" panel on the knowledge page.
**Business:** Onboarding drops from ~12 min of typing FAQs to "paste your website URL, your
agent is ready in 60 seconds." This is the demo moment that closes trials.
**GenAI:** Crawl → extract → Claude chunking (`chunkDocument` already exists in `claude.ts`) →
embed → auto-create `KnowledgeItem`s + suggest `BusinessData` (menu/rooms detected from the site).
- New: `src/lib/ingest/crawl.ts` (fetch + readability extraction, 10-page cap), `src/app/api/business/[id]/agents/[id]/ingest-url/route.ts`
- Inngest function `knowledge/ingest-site` (durable, per-page steps, status surfaced in UI)
- Onboarding Step 3 gets a "Import from website" tab alongside manual FAQ entry
- Guardrail: sanitize crawled text before it enters the system prompt (prompt-injection filter)

### Item 2 — Knowledge-gap detection + weekly AI digest ✦ retention loop — ✅ DONE (2026-07-06; pending `npx prisma db push`)
Shipped: `KnowledgeGap` model (deduped, hits counter), fire-and-forget gap logging on
zero-hit `searchKnowledge` calls, gaps API (list/dismiss/resolve), "Callers asked — no answer"
card on the knowledge page with Add-answer prefill (marks gap resolved on save), Inngest cron
`weekly-digest` (Mon 09:00 IST) with Claude narrative (`generateWeeklyDigest`) + `sendWeeklyDigestEmail`.
**Business:** The owner gets a Monday email: "12 calls last week, 3 leads, callers asked about
parking 4× and your agent had no answer — click to add this FAQ." Turns a passive tool into a
coach. Directly reduces churn.
**GenAI:** Mine `searchKnowledge` queries that returned 0/weak hits (log them per session),
cluster with embeddings, have Claude synthesize suggested FAQ drafts the owner can approve
one-click.
- Log misses in `search-knowledge/route.ts` → new `KnowledgeGap` model (or JSON on session)
- Inngest cron `digest/weekly` → Claude summary over the week's sessions → Resend email
- Dashboard card: "Suggested knowledge" with one-click accept (creates KnowledgeItem + embeds)

### Item 3 — AI lead scoring + intent taxonomy (3–4 days) ✦ inbox that sells itself — ✅ DONE (2026-07-06; pending `npx prisma db push` with prod env)
**Business:** Leads inbox sorted by "hot first." Owners act on the right callback first;
CSV/CRM exports carry the score.
**GenAI:** Extend the existing post-call Claude analysis schema with `leadScore (0–100)`,
`intentCategory` (enum per template: booking / pricing / complaint / info / spam), and
`suggestedReply` (one-tap WhatsApp/SMS text for the owner).
- `src/lib/claude.ts` — extend `generatePostCallAnalysis` response schema
- `AgentSession.leadScore`, `intentCategory` columns; leads page sort + filter
- Zero new infra — rides the existing Inngest pipeline

---

## Wave 2 — Distribution (India ICP unblock)

### Item 4 — WhatsApp outbound confirmations — IMPLEMENTATION_PLAN.md G1 — ✅ DONE (2026-07-06; pending `npx prisma db push` + BSP account)
Shipped: `src/lib/whatsapp/{index,gupshup,twilio}.ts` adapter (env-gated via `WHATSAPP_BSP_PROVIDER`,
+91 default for bare 10-digit numbers), `deliverWhatsAppConfirmation` step in `lead-delivery.ts`
(idempotent via `AgentSession.whatsappDeliveredAt`, never affects email/webhook outcome),
`Business.whatsappEnabled/whatsappFromNumber` + settings-page toggle, README env docs.
Remaining to activate: create Gupshup (or Twilio WhatsApp) account, set env, register Meta template if using template messages.
**Business:** Caller instantly gets "Got it, {name} — the team will call you back about {intent}."
Trust + show-up rate. Prereq for everything WhatsApp.
**GenAI:** Minor — template message assembly from captured lead.
- Provider adapter (`gupshup` first), `deliverWhatsAppConfirmation()` step in `lead-delivery.ts`,
  idempotent via `whatsappDeliveredAt`. Settings toggle + delivery status on session detail.

### Item 5 — WhatsApp inbound text agent (2–3 weeks) — IMPLEMENTATION_PLAN.md G2 ✦ biggest business item
**Business:** "Our customers WhatsApp us, they don't visit our website" is the #1 India demo
blocker. This makes Voxie omnichannel with the SAME brain.
**GenAI:** Strong showcase — same system-prompt assembly + RAG + `captureLead` tool re-hosted
on Gemini text mode with multi-turn state (`WhatsAppConversation`, 24h Meta window), human
takeover switch. Proves the agent core is channel-agnostic.

### Item 6 — Hindi + code-switching prompts (1–2 weeks, parallelizable) — IMPLEMENTATION_PLAN.md L1/L2
**Business:** Perceived-quality jump for the entire Indian ICP; cheap relative to impact.
**GenAI:** Per-template Hindi prompt variants with Indian context (not literal translation),
code-switch instruction in `baseInstructions`, voice selection that handles Hinglish.

---

## Wave 3 — Transactional value (justifies ₹2,999+ plans)

### Item 7 — Google Calendar booking (3–4 weeks) — IMPLEMENTATION_PLAN.md H ✦ highest-MRR feature
**Business:** Clinics/salons pay real money when the agent BOOKS, not just captures intent.
**GenAI:** First true multi-step agentic workflow: `bookAppointment` (fetch free/busy → propose
3 slots) → `confirmAppointment` (create event, invite, WhatsApp confirm). Server-side tools with
explicit failure-mode contract (slot taken, token expired → graceful `captureLead` fallback).
This is where a LangGraph-style state machine becomes defensible — evaluate it here, not before.
- Requires: `Integration` model with AES-256-GCM encrypted tokens (`src/lib/crypto.ts`) — build
  the crypto foundation here; CRM (Item 9) reuses it.

### Item 8 — UPI payment links mid-call (2 weeks) — IMPLEMENTATION_PLAN.md K
**Business:** ₹50–200 deposits kill no-shows; direct revenue story for restaurants/clinics.
**GenAI:** Tool-use with hard guardrails baked into the tool description (owner-set amount cap,
verbal confirmation before firing, never invent amounts) — a nice "constrained agent" case study.
- Builds directly on shipped Razorpay webhook plumbing.

### Item 9 — CRM push: Zoho first (1 week per provider) — IMPLEMENTATION_PLAN.md I
**Business:** "Does it go into my CRM?" is the second question in every serious demo.
- `pushLead()` dispatcher, field-mapping JSON, dry-run test button, failure badge + manual
  re-push (the `WebhookDelivery` table pattern already shipped — reuse it).

---

## Wave 4 — Reliability + GenAI engineering moat

### Item 10 — WebSocket reconnect (1 week) — IMPLEMENTATION_PLAN.md N1
Resumption handles are already captured in `live-session.ts`; wire the actual reconnect on
close 1006/1011 + offline detection, with ≤10s mic buffering. Prerequisite for any phone work.

### Item 11 — Eval harness for voice agents ✦ flagship GenAI project piece — ✅ DONE (2026-07-06; `npm run eval` — needs GOOGLE_GEMINI_API_KEY + ANTHROPIC_API_KEY in .env.local; not yet executed)
**Business:** Stops prompt regressions from costing customers; enables safe prompt iteration.
**GenAI:** The strongest AI-engineering artifact in the repo:
- Simulated callers: Claude role-plays N caller personas per template (angry, vague, Hinglish,
  off-topic, prompt-injection attempts) against the real prompt assembly (text mode).
- Claude-as-judge rubric: did it capture the lead? hallucinate a booking? use searchKnowledge?
  stay in language? Refuse out-of-scope?
- LangSmith datasets + CI script (`npm run eval`) with pass/fail thresholds per template.
- Run before merging any prompt change.

### Item 12 — Call recording with consent + PII redaction (2 weeks) — IMPLEMENTATION_PLAN.md N4
**Business:** Larger SMB/agency eval requirement; QA + dispute resolution.
**GenAI:** Post-call redaction pass (regex for phone/PAN/Aadhaar + Claude verification), raw vs
redacted URLs, audit-logged access. Good responsible-AI story.

### Item 13 — Metered overage billing (1 week) — IMPLEMENTATION_PLAN.md N3
Soft-cap option at ₹X/min with month-end Razorpay one-time charge. Converts quota 429s into
revenue instead of churn.

---

## Deliberately deferred (unchanged from IMPLEMENTATION_PLAN.md)
Twilio phone DIDs (heavy infra — gate on Item 10 + latency test), agency white-label
(team/multi-member base already shipped; wait for agency demand), voice cloning,
HubSpot/Salesforce, multi-region deploy.

---

## Suggested execution order

```
Item 0   Doc sync                          ← now, ½ day
Item 3   AI lead scoring                   ← 3-4 days, zero new infra, instant dashboard win
Item 1   Website-to-agent onboarding       ← the demo-closer
Item 2   Knowledge gaps + weekly digest    ← retention loop
Item 4   WhatsApp outbound                 ← distribution starts
Item 6   Hindi prompts                     ← parallel with Item 5
Item 5   WhatsApp inbound agent            ← biggest business unlock
Item 11  Eval harness                      ← before heavy prompt work in Items 5-7
Item 7   Calendar booking                  ← MRR
Item 8   UPI payments
Item 9   CRM push (Zoho)
Item 10  WS reconnect → Item 12 recording → Item 13 overage
```

Rationale for starting with 3 → 1 → 2: all three ride existing infrastructure (Inngest, Claude
pipeline, embeddings), each is a visible product improvement in under two weeks total, and they
sharpen the demo before the heavier WhatsApp/booking integrations begin.
