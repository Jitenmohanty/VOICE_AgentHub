# Voxie — Template-Specific Agent Implementation Plan

> Each agent type gets its own onboarding form, data model, public page, and conversation flow.
> Replaces the current "one size fits all" generic config (name → greeting → personality → rules).

---

## Current State (What Exists)

### Onboarding (`/business/onboarding`)
- **Step 1:** Business name, industry, description, phone, website, address → `Business` table
- **Step 2:** Agent name, greeting, personality + template `configFields` (2-3 simple fields per type) → `Agent` table
- **Step 3:** FAQ quick-add with industry suggestion chips → `KnowledgeItem` table
- **Step 4:** Go live with public link `/a/{slug}`

### Per-Agent Config Fields (in `templates.ts`)
| Template | Current Fields |
|----------|---------------|
| Hotel | `hotelName`, `hotelType` (Luxury/Business/Budget/Resort/Boutique) |
| Medical | `clinicName`, `specialty` (General/Dental/Cardiology/Pediatrics/Dermatology) |
| Interview | `techStack` (multi-select, 13 options), `level` (Junior→Principal), `company` |
| Restaurant | `restaurantName`, `cuisineType` (7 cuisines) |
| Legal | `jurisdiction`, `legalArea` (6 areas) |

### What's Missing
- **Hotel/Restaurant:** No structured data entry (rooms, menu items, prices). The `BusinessData` table exists but there's no UI to populate it — only a raw JSON editor.
- **Medical:** No doctor roster, schedule, or insurance list.
- **Interview:** No pre-call form for candidates. No multi-round structured flow. No post-interview report.
- **Legal:** No procedure templates, fee structure, or consultation flow.
- **All agents:** Tool handlers return hardcoded mock data. No RAG queries against `KnowledgeItem.embedding`.

### Existing Infrastructure (Don't Touch)
- ✅ Voice pipeline: Gemini Live API WebSocket, AudioWorklet, 16kHz/24kHz PCM, transcription
- ✅ Auth: NextAuth v5 (Google, GitHub, Credentials), JWT strategy
- ✅ Multi-tenant schema: User → Business → Agent → KnowledgeItem / BusinessData / AgentSession
- ✅ Onboarding wizard: 4-step flow (works for both OAuth and credentials users)
- ✅ Public page: `/a/{slug}` with voice interface, transcript, rating
- ✅ Business dashboard: Agent management, session history, knowledge CRUD, data CRUD
- ✅ Session management: Create, save with transcript/duration, rating modal

---

## Phase A: Template-Specific Onboarding Forms

> Replace generic config with rich, industry-specific guided forms in the onboarding wizard (Step 2) and agent config page.

### A1. Hotel Concierge — Structured Property Setup

**New onboarding Step 2 fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Hotel Name | text | ✅ | Already exists as `hotelName` |
| Hotel Type | select | ✅ | Already exists |
| Star Rating | select (1-5 stars) | | New |
| Total Rooms | number | | New |
| Check-in Time | time picker | ✅ | e.g., "3:00 PM" |
| Check-out Time | time picker | ✅ | e.g., "11:00 AM" |
| Amenities | multi-select checkboxes | | Pool, Gym, Spa, Restaurant, Bar, Room Service, Laundry, Parking, Airport Shuttle, Business Center, Wi-Fi, Concierge |
| Parking Info | text | | Free/Paid/Valet + price |
| Restaurant Hours | text | | "7 AM - 10 PM" |
| Nearby Attractions | textarea | | Comma-separated or list |

**Where data is saved:**
- Simple fields → `Agent.config` JSON (extend current `hotelName`/`hotelType`)
- The system prompt is rebuilt from these fields at call time

**Files to modify:**
- `src/lib/templates.ts` — Add new `configFields` to hotel template
- `src/app/(business)/business/onboarding/page.tsx` — Step 2 renders new field types (time picker, number, checkboxes)
- `src/app/(business)/business/agents/[agentId]/page.tsx` — Same fields in agent config page
- `src/lib/agents/hotel-agent.ts` — `getSystemPrompt(config)` uses new fields
- `src/lib/gemini/agent-prompts.ts` — No changes (already delegates to hotel-agent.ts)

---

### A2. Restaurant Host — Menu Builder

**New onboarding Step 2 fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Restaurant Name | text | ✅ | Already exists |
| Cuisine Type | select | ✅ | Already exists |
| Operating Hours | text | ✅ | "Mon-Fri 11AM-10PM, Sat-Sun 10AM-11PM" |
| Delivery Available | toggle | | Yes/No |
| Delivery Radius | text | | "5 miles" (shown if delivery = yes) |
| Reservation System | toggle | | Yes/No |

**New onboarding Step 2.5 — Menu Builder (after basic config, before FAQs):**

A dedicated "Add Menu Items" sub-step:
- **Add Item:** Name, Price, Category (Starters / Mains / Desserts / Drinks / Sides), Description, Allergens (multi-select: Gluten, Dairy, Nuts, Shellfish, Soy, Eggs, Vegan, Vegetarian)
- **Daily Specials:** toggle per item
- Items saved to `BusinessData` with `dataType: "menu"`
- Show menu preview as table/cards

**Where data is saved:**
- Config fields → `Agent.config` JSON
- Menu items → `BusinessData` table (`dataType: "menu"`, `data: { items: [...] }`)

**Files to modify:**
- `src/lib/templates.ts` — Add new fields + `defaultBusinessDataTypes: ["menu"]`
- Onboarding page — Add menu builder step (new sub-component `MenuBuilder.tsx`)
- `src/lib/agents/restaurant-agent.ts` — `getSystemPrompt(config)` includes menu summary; tool handlers query `BusinessData`
- `src/components/business/MenuBuilder.tsx` — **New component** for menu item CRUD
- Agent config page — Menu management section

---

### A3. Medical Assistant — Doctor Roster & Services

**New onboarding Step 2 fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Clinic Name | text | ✅ | Already exists |
| Specialty | select | ✅ | Already exists |
| Working Hours | text | ✅ | "Mon-Fri 9AM-5PM" |
| Emergency Protocol | textarea | | "Call 911 for emergencies..." |
| Accepted Insurance | multi-select | | Aetna, BlueCross, Cigna, UnitedHealth, Medicare, Medicaid, Other |

**New onboarding Step 2.5 — Doctor Roster:**

- **Add Doctor:** Name, Specialization, Available Days (multi-select: Mon-Sun), Hours (from-to), Accepting New Patients (toggle)
- Saved to `BusinessData` with `dataType: "doctors"`
- Show roster as a list/table

**Where data is saved:**
- Config fields → `Agent.config` JSON
- Doctor roster → `BusinessData` table (`dataType: "doctors"`, `data: { doctors: [...] }`)

**Files to modify:**
- `src/lib/templates.ts` — Extended config fields
- Onboarding page — Doctor roster builder sub-step
- `src/components/business/DoctorRoster.tsx` — **New component**
- `src/lib/agents/medical-agent.ts` — System prompt + tool handlers use roster data

---

### A4. Legal Advisor — Practice & Procedure Setup

**New onboarding Step 2 fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Firm/Practice Name | text | ✅ | New field |
| Jurisdiction | text | ✅ | Already exists |
| Legal Area | select | ✅ | Already exists |
| Additional Practice Areas | multi-select | | Beyond primary area |
| Fee Structure | textarea | | "Initial consultation: Free. Hourly rate: $200-$400" |
| Consultation Process | textarea | | "Book a 30-min consultation via..." |

**Where data is saved:**
- All fields → `Agent.config` JSON (legal doesn't need structured data tables yet)

**Files to modify:**
- `src/lib/templates.ts` — Extended config fields
- Onboarding page — Renders new field types
- `src/lib/agents/legal-agent.ts` — System prompt uses fee structure, consultation process

---

### A5. Interview Coach — Pre-Interview Config (Owner Side)

**New onboarding Step 2 fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Company Name | text | | Already exists |
| Tech Stack Focus | multi-select | ✅ | Already exists (13 options) — expand to 20+ |
| Default Level | select | | Already exists (Junior → Principal) |
| Interview Style | select | | Friendly / Strict / Mixed |
| Number of Rounds | select | | 3 / 4 / 5 (default: 5) |
| Enable System Design | toggle | | For Mid+ candidates |
| Enable HR/Behavioral | toggle | ✅ default on | STAR method questions |
| Scoring Enabled | toggle | ✅ default on | Score each answer 1-10 |
| Custom Instructions | textarea | | Owner can add company-specific notes |

**Where data is saved:**
- All fields → `Agent.config` JSON

**Files to modify:**
- `src/lib/templates.ts` — Extended config fields for interview
- Onboarding page — Renders new interview-specific fields
- `src/lib/agents/interview-agent.ts` — System prompt uses round config, scoring, style

---

### Phase A Summary — What Changes

| File | Change Type |
|------|------------|
| `src/lib/templates.ts` | Extend `configFields` for all 5 templates |
| `src/app/(business)/business/onboarding/page.tsx` | Step 2 renders new field types (time, number, toggle, checkbox, textarea). Add sub-steps for menu/doctor builders |
| `src/app/(business)/business/agents/[agentId]/page.tsx` | Same field types in agent config editor |
| `src/components/business/MenuBuilder.tsx` | **New** — Menu item CRUD for restaurant |
| `src/components/business/DoctorRoster.tsx` | **New** — Doctor roster CRUD for medical |
| `src/lib/agents/hotel-agent.ts` | System prompt uses all new config fields |
| `src/lib/agents/restaurant-agent.ts` | System prompt + tools use menu from BusinessData |
| `src/lib/agents/medical-agent.ts` | System prompt + tools use doctor roster from BusinessData |
| `src/lib/agents/legal-agent.ts` | System prompt uses extended config |
| `src/lib/agents/interview-agent.ts` | System prompt uses round/scoring config |

**No changes to:** voice pipeline, auth, session management, public page, Prisma schema, API routes.

---

## Phase B: Interview Agent — Special Treatment (Killer Feature)

> The interview agent is fundamentally different. The customer provides inputs BEFORE the call, and the call follows a structured multi-round flow with scoring.

### B1. Pre-Call Form on Public Page (`/a/{slug}`)

When `templateType === "interview"`, the public page shows a **pre-call form** instead of the simple "Start Call" button:

**Form fields (collected from the candidate):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Your Name | text | ✅ | Saved as `callerName` on AgentSession |
| Tech Stack | multi-select | ✅ | Pre-populated from owner's config, candidate picks their actual stack |
| Experience Level | select | ✅ | Junior / Mid / Senior / Lead / Principal |
| Target Role | text | | "Frontend Engineer at Google" |
| Resume | file upload (PDF) | | Extract skills via Claude (Phase C) |

**After form submission:**
1. Create `AgentSession` via `POST /api/public/agent/{slug}/session` with candidate's selections
2. Build interview-specific system prompt including: selected stack, level, round structure
3. Connect to Gemini Live API with this customized prompt
4. Call starts with Round 1: "Tell me about yourself"

**Files to create/modify:**
- `src/app/a/[slug]/page.tsx` — Add conditional pre-call form when `templateType === "interview"`
- `src/components/public/InterviewPreCallForm.tsx` — **New** — The form component
- `src/app/api/public/agent/[slug]/session/route.ts` — **New** — Create session with candidate context (no auth required)
- `src/lib/agents/interview-agent.ts` — `getSystemPrompt(config, candidateContext)` — accepts candidate context

### B2. Structured Multi-Round Interview Flow

The interview agent's system prompt instructs Gemini to follow a structured progression:

```
Round 1 — Introduction (2 min)
  "Tell me about yourself and your experience with {techStack}"
  → Score: Communication, Relevance

Round 2 — Core Language (5-8 questions)
  Based on primary stack selection (e.g., JavaScript closures, Python decorators)
  Easy → Medium → Hard progression
  → Score each answer 1-10

Round 3 — Framework/Library Deep Dive (3-5 questions)
  Based on specific selections (React hooks, Node.js streams, Django ORM)
  → Score each answer 1-10

Round 4 — System Design (if Mid+ level, if enabled by owner)
  One design question appropriate to level
  → Score: Architecture, Scalability, Trade-offs

Round 5 — HR/Behavioral (if enabled by owner)
  STAR method questions: "Tell me about a time when..."
  → Score: Communication, Problem-solving, Teamwork

Wrap-up:
  "Thank you for your time. You'll receive a detailed report shortly."
```

**Implementation:** This is entirely in the system prompt — no code changes to the voice pipeline. Gemini follows the instructions.

**Enhanced tool declarations for interview agent:**
- `scoreAnswer(round, questionNumber, score, feedback)` — records per-question scores
- `advanceRound(nextRound)` — signals round transition
- `endInterview(overallImpression)` — triggers post-interview flow

**Files to modify:**
- `src/lib/agents/interview-agent.ts` — Complete rewrite of system prompt with round structure + new tools
- Tool handler saves scoring data to `AgentSession.actionItems` JSON during the call

### B3. Post-Interview Session Enrichment

After the interview ends (disconnect), the session data includes the full transcript + scores from tool calls.

**Immediate (no Claude yet):**
- Parse `actionItems` from tool calls during the session
- Display round-by-round scores in the session detail view
- Calculate overall score (average of round scores)

**Files to modify:**
- `src/app/(business)/business/agents/[agentId]/sessions/page.tsx` — Show interview scores in session detail
- `src/app/a/[slug]/page.tsx` — Post-call screen shows basic score summary

---

## Phase C: Post-Interview Claude Report (AI-Generated Analysis)

> After the interview call ends, send the transcript + scores to Claude for a detailed analysis report.

### C1. Claude Integration

**Trigger:** When an interview `AgentSession` status changes to "completed"

**Claude receives:**
- Full transcript (from `AgentSession.transcript`)
- Per-round scores (from `AgentSession.actionItems`)
- Candidate context (stack, level, target role)

**Claude generates:**
- Overall score (1-100)
- Per-round breakdown with comments
- Communication feedback (filler words, confidence, clarity)
- Technical strengths and weaknesses
- Areas to improve with specific recommendations
- Recommended learning resources

**Where stored:**
- `AgentSession.summary` — The full report (markdown)
- `AgentSession.sentimentScore` — Overall score (0-100)
- `AgentSession.sentiment` — "strong" / "average" / "needs_work"

**Files to create/modify:**
- `src/lib/claude/client.ts` — **New** — Anthropic SDK client
- `src/lib/claude/interview-report.ts` — **New** — Report generation prompt + parser
- `src/app/api/sessions/[id]/report/route.ts` — **New** — Trigger report generation
- `src/app/a/[slug]/page.tsx` — Post-call shows "Generating your report..." then displays it
- `src/app/(business)/business/agents/[agentId]/sessions/page.tsx` — Session detail shows the report

### C2. Resume Parsing (Optional Enhancement)

If the candidate uploaded a resume PDF:
1. Extract text from PDF (using `pdf-parse` package)
2. Send to Claude: "Extract skills, experience, education from this resume"
3. Include extracted info in the interview system prompt for personalized questions
4. Include in the post-interview report ("Based on your resume, we noticed...")

**Files to create:**
- `src/lib/claude/resume-parser.ts` — **New** — PDF text extraction + Claude skill extraction
- `src/app/api/public/agent/[slug]/resume/route.ts` — **New** — Upload endpoint

---

## Phase D: Dynamic Public Pages Per Template

> Each agent type gets a different public-facing page layout before the call starts.

### D1. Hotel — Simple Click-to-Call (Current Behavior)
- Business name + logo
- Agent greeting
- "Start Call" button
- **No changes needed** — current `/a/{slug}` page works

### D2. Restaurant — Menu Preview + Call
- Show menu items grouped by category (fetched from `BusinessData`)
- Price list
- "Call to Order" button → starts voice call
- "Make Reservation" button → starts voice call with reservation context

**Files to create:**
- `src/components/public/RestaurantPreCall.tsx` — **New** — Menu preview component
- `src/app/a/[slug]/page.tsx` — Conditional rendering based on `templateType`
- `src/app/api/public/agent/[slug]/data/route.ts` — **New** — Fetch public business data (no auth)

### D3. Interview — Pre-Call Form (Already in Phase B1)
- Stack picker + level selector + resume upload → then call

### D4. Medical — Appointment or Question
- Show doctor list + availability (from `BusinessData`)
- Two options: "Book Appointment" / "Ask a Health Question"
- Each starts the call with different context in the system prompt

**Files to create:**
- `src/components/public/MedicalPreCall.tsx` — **New** — Doctor list + option picker

### D5. Legal — Topic Selector
- Show practice areas
- "Describe your legal matter" dropdown → starts call with context
- Disclaimer: "This is informational only, not legal advice"

**Files to create:**
- `src/components/public/LegalPreCall.tsx` — **New** — Topic selector + disclaimer

---

## Phase E: Connect Tool Handlers to Real Data

> Replace hardcoded mock responses with actual database queries.

### Current State (All Mock)
```typescript
// hotel-agent.ts
handleToolCall("checkAvailability", args) → { available: true, roomType: "Deluxe", price: 299 }
// restaurant-agent.ts
handleToolCall("getMenu", args) → { items: [...hardcoded...] }
```

### Target State
```typescript
// hotel-agent.ts
handleToolCall("checkAvailability", args, agentId) → query BusinessData where agentId & dataType="rooms"
// restaurant-agent.ts
handleToolCall("getMenu", args, agentId) → query BusinessData where agentId & dataType="menu"
```

### Changes Required

1. **Pass `agentId` to tool handlers** — Currently `handleAgentToolCall(agentType, name, args)`. Change to `handleAgentToolCall(agentType, name, args, agentId)`.

2. **Each agent module's `handleToolCall` queries the DB:**
   - Hotel: `checkAvailability` → `BusinessData` where `dataType = "rooms"`
   - Restaurant: `getMenu` → `BusinessData` where `dataType = "menu"`
   - Medical: `checkDoctorAvailability` → `BusinessData` where `dataType = "doctors"`
   - Legal: `getLegalTermDefinition` → `KnowledgeItem` where `category = "legal_terms"`

3. **RAG for knowledge queries** — Use pgvector similarity search on `KnowledgeItem.embedding` to find relevant FAQs.

**Files to modify:**
- `src/lib/gemini/agent-prompts.ts` — Pass `agentId` through
- `src/lib/agents/hotel-agent.ts` — DB queries in tool handlers
- `src/lib/agents/restaurant-agent.ts` — DB queries in tool handlers
- `src/lib/agents/medical-agent.ts` — DB queries in tool handlers
- `src/lib/agents/legal-agent.ts` — DB queries in tool handlers
- `src/lib/agents/interview-agent.ts` — Score tracking in tool handlers
- `src/lib/gemini/live-session.ts` — Pass `agentId` when calling tool handlers

---

## Implementation Order (Priority)

```
Phase A  ← Start here (template-specific onboarding forms)
  A5: Interview config fields
  A1: Hotel config fields
  A2: Restaurant config + menu builder
  A3: Medical config + doctor roster
  A4: Legal config fields

Phase B  ← Killer feature
  B1: Interview pre-call form on public page
  B2: Multi-round structured interview flow
  B3: Score display in session detail

Phase D  ← Visual differentiation
  D2: Restaurant menu preview
  D4: Medical doctor list + appointment choice
  D5: Legal topic selector

Phase E  ← Real data instead of mocks
  Connect all tool handlers to BusinessData/KnowledgeItem tables

Phase C  ← AI enhancement
  C1: Claude post-interview report
  C2: Resume parsing (optional)
```

---

## What NOT to Change

- **Voice pipeline** — GeminiLiveSession, useAudioStream, AudioWorklet, useGeminiLive
- **Auth system** — NextAuth config, JWT callbacks, providers
- **Prisma schema** — Current tables are sufficient (Agent.config JSON is flexible, BusinessData handles structured data)
- **API routes** — Existing CRUD routes for business/agent/knowledge/data/sessions all work
- **Dashboard layout** — Sidebar, session history, agent list pages
- **Session save flow** — saveSession, saveSessionBeacon, rating modal

---

## File Impact Summary

| Category | Files | Change Type |
|----------|-------|------------|
| Templates | `src/lib/templates.ts` | Extend config fields for all 5 |
| Onboarding | `src/app/(business)/business/onboarding/page.tsx` | New field renderers, sub-steps |
| Agent Config | `src/app/(business)/business/agents/[agentId]/page.tsx` | New field renderers |
| Agent Prompts | `src/lib/agents/*.ts` (5 files) | Richer system prompts, DB tool handlers |
| Public Page | `src/app/a/[slug]/page.tsx` | Template-conditional pre-call UIs |
| New Components | `InterviewPreCallForm`, `MenuBuilder`, `DoctorRoster`, `RestaurantPreCall`, `MedicalPreCall`, `LegalPreCall` | New files |
| New API Routes | `POST /api/public/agent/[slug]/session`, `POST /api/public/agent/[slug]/resume`, `GET /api/public/agent/[slug]/data` | New files |
| Claude Integration | `src/lib/claude/client.ts`, `interview-report.ts`, `resume-parser.ts` | New files (Phase C) |
| Prompt Builder | `src/lib/gemini/agent-prompts.ts` | Pass agentId to tool handlers |

---

# PART TWO — India SMB Integrations & Workflows Roadmap (Phases G–N)

> Phases A–E above are the original template / data work. Phases 0–6 (shipped, see `README.md`) cover security, lead delivery, embed widget, Stripe + Razorpay billing, AI pipeline tuning, and the dual-provider checkout. This section adds the **next chapter focused on Indian SMB go-to-market**: WhatsApp as a channel, in-call appointment booking, regional CRM push, Twilio inbound DIDs, UPI mid-call payments, multilingual, agency / white-label, and reliability gaps.

## ICP recap
- **Primary**: Indian SMB — clinics, salons, real estate brokers, restaurants, coaching/education, auto service.
- **Buyer**: owner-operator (1–10 employees) OR a digital agency reselling to 5–30 local SMBs.
- **Pricing pressure**: ₹999–₹2,999/mo entry; ₹7,999+ only with real integrations attached.
- **Distribution reality**: WhatsApp is the front door, not the website. The embedded iframe is secondary. Phase G makes WhatsApp parity table-stakes.

## Sequencing principle
ROI = (% of India demos that ask for it) ÷ (eng-weeks to ship). The ordering below reflects what's blocking sales today vs. what's an upsell once the base is sticky.

---

## Phase G — WhatsApp Business as primary inbound channel (4–5 weeks)

The single most common blocker in India demos: *"we don't really get website visitors — our customers WhatsApp us."* This phase makes WhatsApp the front door without rebuilding the AI pipeline.

### G1. Outbound: WhatsApp confirmation after every call (week 1)
- After `captureLead` fires, send a templated WhatsApp message to the caller's phone (if provided) confirming the team will reach out + a copy of what they asked.
- Use **Gupshup** (cheaper, India-native) or **Twilio WhatsApp** (better DX, US-pricing) — pick one, keep the other as a fallback adapter.
- Pre-register a Meta-approved template: `voxie_lead_confirmation_v1`.
- Owner sees delivery status (`queued / sent / delivered / read / failed`) on the session detail page.

**Files:**
- `src/lib/whatsapp/gupshup.ts`, `src/lib/whatsapp/twilio.ts`, `src/lib/whatsapp/index.ts` — provider adapter pattern
- `src/lib/lead-delivery.ts` — add `deliverWhatsAppConfirmation()` step after `deliverWebhook`, idempotent via `AgentSession.whatsappDeliveredAt`
- Prisma: `Business.whatsappEnabled`, `Business.whatsappBspProvider`, `Business.whatsappFromNumber`; `AgentSession.whatsappDeliveredAt`, `whatsappMessageId`, `whatsappStatus`
- `/business/settings` — WhatsApp toggle + template preview + delivery log
- Env: `WHATSAPP_BSP_PROVIDER=gupshup|twilio`, `WHATSAPP_BSP_API_KEY`, `WHATSAPP_BSP_APP_NAME`

### G2. Inbound: WhatsApp text agent (weeks 2–4)
- Owner gets a WhatsApp Business number. Customers message it. Gemini (text mode, not Live) replies using the same system-prompt assembly as the voice agent.
- Same RAG context, same `captureLead` tool, same lead-delivery pipeline. **No new prompt work** — reuse `getAgentSystemPrompt`.
- Multi-turn conversation state stored in `WhatsAppConversation` (24h Meta session window).
- BSP webhook → `/api/whatsapp/inbound` → `generateText()` (Gemini `gemini-2.5-flash` text mode) → reply via BSP.

**Files:**
- `src/app/api/whatsapp/inbound/route.ts` — webhook with BSP-specific signature verification + dispatch
- `src/lib/gemini/text-session.ts` — text-mode chat using the existing prompt builder + tools schema; `captureLead` becomes a structured-output marker the server detects and persists
- Prisma: new `WhatsAppConversation` ( `businessId`, `agentId`, `fromNumber`, `messages JSON[]`, `capturedLead JSON?`, `lastInboundAt`, `humanTakeoverUntil` )
- `/business/agents/[agentId]/whatsapp` — conversations list, full thread view, "Take over from AI" button (pauses bot for 4h via `humanTakeoverUntil`)

### G3. WhatsApp Click-to-Call CTA on embed widget (1 day)
- Show a *"Prefer WhatsApp?"* link on `/embed/{slug}` when `Business.whatsappEnabled = true`.
- Deep-links to `https://wa.me/{number}?text=Hi%2C%20I%27m%20interested%20in%20{agentName}`.
- Carries a `voxie_src=embed_{slug}` query so the inbound conversation knows the customer came from the website widget (attribution).

### Success metrics
- WhatsApp template delivery rate ≥ 95%
- % of voice leads with phone that get a WhatsApp confirmation ≥ 80%
- Inbound WhatsApp → captured lead conversion ≥ 40% (parity with voice)
- Cost / lead via WhatsApp ≤ ₹3 (BSP message fees included)

---

## Phase H — In-call appointment booking via Google Calendar + Calendly (3–4 weeks)

Today's `captureLead` records intent. Clinics, salons, and real-estate brokers want the AI to **actually book the slot**. This is the highest-MRR feature for those verticals.

### H1. Owner-side calendar connect
- OAuth flow on `/business/settings/integrations`: connect Google Calendar (free) or Calendly (Calendly Pro+).
- Per-agent slot config: working hours, slot duration (15 / 30 / 60 min), buffer, services-to-duration map.
- Per-doctor / per-room calendar mapping: extends `BusinessData.doctors[].calendarId`, `BusinessData.rooms[].calendarId`.

**Files:**
- `src/app/api/integrations/google-calendar/connect/route.ts` + `callback/route.ts` — OAuth init + handler
- `src/app/api/integrations/calendly/connect/route.ts` + `callback/route.ts`
- Prisma: new `Integration` model ( `businessId`, `provider`, `accessToken (encrypted)`, `refreshToken (encrypted)`, `expiresAt`, `scope`, `metadata JSON` )
- Inngest scheduled function `integration/refresh-tokens` (hourly) — refreshes anything within 30 min of expiry

### H2. New `bookAppointment` + `confirmAppointment` tools (server-side — bookings touch real calendars)
- Tool 1 — `bookAppointment({ service, preferredDate?, preferredTimeRange? })`:
  1. Browser → `POST /api/public/agent/{slug}/book-appointment` with `updateToken`
  2. Server fetches free/busy from Google or Calendly availability
  3. Returns top 3 slots → tool response
  4. Model proposes them verbally ("Tuesday at 10, Wednesday at 2, or Thursday at 4")
- Tool 2 — `confirmAppointment({ slotIso, name, phone, email })`:
  1. Server creates the calendar event with caller as invitee
  2. Sends Google Calendar invite to caller's email
  3. Stamps `AgentSession.bookedAppointmentAt`, `bookedSlot`, `bookedEventId`
  4. Triggers a WhatsApp confirmation (Phase G G1) with the event details

**Files:**
- `src/lib/gemini/agent-prompts.ts` — `bookAppointmentTool`, `confirmAppointmentTool` definitions
- `src/lib/agents/medical-agent.ts`, `legal-agent.ts`, `hotel-agent.ts`, future `salon-agent.ts`, `real-estate-agent.ts` — add booking tools to `enabledTools`
- `src/app/api/public/agent/[slug]/book-appointment/route.ts` (new)
- `src/app/api/public/agent/[slug]/confirm-appointment/route.ts` (new)
- `src/lib/calendar/google.ts`, `src/lib/calendar/calendly.ts`, `src/lib/calendar/index.ts` — provider registry
- `src/lib/gemini/live-session.ts` — wire new tools through `handleAgentToolCall` (server round-trip, NOT client-side)

### H3. Update `leadCaptureRule` per-agent
- Default (no booking enabled): existing rule — "for any transaction use `captureLead`."
- When `bookAppointment` is enabled: "for **appointment** requests use `bookAppointment` (real calendar booking). For all other transactions use `captureLead`."
- Hard rule: NEVER call both for the same caller in the same turn.

### H4. Failure modes
| Failure | Behavior |
|---|---|
| Calendar API 5xx | Server returns `{ error: "calendar_unavailable", fallback: "captureLead" }` — model falls back gracefully |
| Token expired, refresh fails | Mark `Integration.status = "needs_reauth"`; email owner; tool returns same fallback |
| Slot taken between fetch + confirm | Return `{ error: "slot_taken", alternateSlots: [...] }`; model offers alternatives |
| Caller declines all 3 slots | Tool returns `more_slots()` with next 3 — capped at 3 fetches per call |

### Success metrics
- Booking-tool calls that produce a real calendar event ≥ 85%
- Calendar-invite email delivery rate ≥ 95%
- Owner manual rebooking ≤ 5%

---

## Phase I — Regional CRM push: LeadSquared, Zoho, Kylas (2–3 weeks)

HubSpot/Salesforce are < 5% of Indian SMB. LeadSquared, Zoho CRM, and Kylas run most demos. Skipping these = leaving the lead in the email and losing the CRM pitch.

### I1. Per-business CRM connector
- `/business/settings/integrations/crm`: pick provider, paste API key + base URL, map fields.
- Field mapping is JSON: `{ name: "FirstName", phone: "Phone", intent: "LeadDescription", source: "LeadSource" }`.
- **Test button**: dry-runs "Voxie Test Lead" into the CRM so owners confirm it lands before saving.

**Files:**
- `src/lib/crm/leadsquared.ts`, `src/lib/crm/zoho.ts`, `src/lib/crm/kylas.ts` — provider clients
- `src/lib/crm/index.ts` — `pushLead(provider, config, lead)` dispatcher + provider registry
- `src/lib/lead-delivery.ts` — add `deliverCrmPush()` step (after webhook, before WhatsApp)
- Prisma: `Business.crmProvider`, `Business.crmConfig JSON`, `Business.crmSecretEncrypted` (encrypted at rest)
- `AgentSession.crmPushedAt`, `crmRecordId`, `crmError`

### I2. Encryption at rest for integration secrets (one-time foundation)
- Today `webhookSecret` is plaintext. CRM keys + OAuth tokens (Phase H) need AES-256-GCM at rest.
- `src/lib/crypto.ts` — `encrypt(plaintext)` / `decrypt(ciphertext)` using `CRM_ENCRYPTION_KEY` env (`openssl rand -hex 32`).
- Lazy re-encrypt: `webhookSecret` rows get re-encrypted on next read; new rows always encrypted.

### I3. Failure handling
- Inngest function-level retry (3) handles transient (429, 502).
- Permanent failures (401, 422 field-mapping) → log to `LeadDeliveryLog` table; owner sees red badge + reason on the session card.
- Manual re-push button on session detail modal.

### Success metrics
- CRM push success ≥ 92% after retries
- Setup time on a live demo ≤ 5 min
- 100% of failures are surfaced to the owner with a re-push button (no silent loss)

---

## Phase J — Twilio inbound phone numbers — Indian DIDs (3–4 weeks, heavy infra)

For SMBs who advertise their number on hoardings, cards, and Google Maps. Today the entry point is a website widget; Phase J adds a real telephone number.

### J1. Provision Indian DID via Twilio
- Owner clicks "Add phone number" → Voxie purchases a Twilio Indian DID under our master account → bills owner ₹399/mo flat (markup absorbs the cost + KYC overhead).
- KYC docs (Aadhaar / GSTIN / address proof) uploaded once per business; we forward to Twilio.
- Number stored on `Business.phoneNumber`, `Business.phoneProvider = "twilio"`.

### J2. Twilio → Gemini Live bridge
- Inbound call hits Twilio webhook → returns TwiML `<Stream>` pointing at `wss://voxie.in/api/twilio/voice/stream/{slug}`.
- Relay bidirectionally transcodes Twilio µ-law 8 kHz ↔ Gemini Live PCM16 16 kHz/24 kHz.
- Same system prompt assembly, same `captureLead` flow, same post-call Inngest pipeline. Phone caller is just a different transport.

**Files:**
- `src/app/api/twilio/voice/incoming/route.ts` — TwiML response
- `src/lib/telephony/twilio-bridge.ts` — µ-law transcoding (`mu-law` package), audio buffer relay
- Prisma: `AgentSession.transport` enum (`web | whatsapp | phone`), `AgentSession.twilioCallSid`
- **Infra**: a long-lived WebSocket needs a Node runtime — Vercel serverless won't fit. Recommend a small **Fly.io machine** sitting alongside the main app, OR Cloudflare Workers Durable Objects.

### J3. Heavy realities to plan for
- **Latency budget**: caller → Twilio → our relay → Gemini Live → back. Target P50 < 600 ms, P95 < 1200 ms. Test before committing eng weeks.
- **Indian DID compliance**: Twilio India requires KYC paperwork per number — 1–2 weeks lead time per provisioning. Bake this into the pricing page ("activates in 5–10 business days").
- **Cost**: Twilio India inbound ≈ ₹1.5/min + Gemini Live cost. Need ≥ ₹2.5/min landed price to avoid losing money on usage-heavy callers.
- **Concurrency**: a single Fly.io machine handles ≈ 50 concurrent calls. Plan horizontal scale before Phase J GA.

### Success metrics
- E2E call latency P50 < 600 ms, P95 < 1200 ms
- Twilio + Gemini blended cost < ₹2.5/min
- Phone lead capture rate within 5pp of web

---

## Phase K — UPI / Razorpay payments mid-call (2 weeks)

Restaurants want ₹50 reservation deposits. Clinics want ₹200 consultation fees. Salons want full-pay-in-advance. UPI link generation during the call removes the "I'll pay when I call back" drop-off.

### K1. New `generatePaymentLink` tool
- Tool args: `{ amount, description, expiresInMinutes? }`
- Server creates Razorpay Payment Link, returns URL.
- Send URL via SMS (Razorpay built-in) **and** WhatsApp (Phase G G1, after launch).
- Razorpay webhook `payment_link.paid` → stamp `AgentSession.paymentReceivedAt`, `paymentAmount`.

**Files:**
- `src/app/api/public/agent/[slug]/payment-link/route.ts` — gated by `updateToken` + `Agent.config.paymentEnabled = true`
- `src/lib/payments/razorpay-payment-link.ts` — Razorpay SDK wrapper
- `src/lib/gemini/agent-prompts.ts` — `generatePaymentLinkTool` (default OFF; owners enable per agent)
- Prisma: `Agent.config.paymentEnabled`, `Agent.config.maxPaymentAmount`; `AgentSession.paymentLinkId`, `paymentAmount`, `paymentReceivedAt`
- Razorpay webhook handler (`src/app/api/billing/razorpay/webhook/route.ts`) extends to dispatch `payment_link.paid`

### K2. Compliance + UX rules baked into the tool description
- "Only offer payment for explicit deposits or fees the owner has configured. NEVER invent amounts."
- Owner must enable per-agent + set `maxPaymentAmount` cap (default ₹2,000).
- Agent verbally confirms amount + reason before calling the tool ("So that's ₹200 for the consultation booking fee — should I send the UPI link?").
- Refund flow: owner refunds from Razorpay dashboard; webhook updates session `paymentRefundedAt`.

### Success metrics
- Payment link CTR ≥ 60%
- Link → paid conversion ≥ 35%
- Disputes / chargebacks ≤ 1%

---

## Phase L — Multilingual: Hindi + regional (2–3 weeks)

Commit `b9af847` added BCP-47 language plumbing. Phase L makes it production-grade for Indian languages.

### L1. Hindi-first prompt versions
- Per-template Hindi system prompts (`src/lib/agents/medical-agent.hi.ts`, etc.) — **rewritten with Indian context** (insurance names: Star Health, HDFC Ergo; pin codes; ₹ pricing; doctor titles), not literal translations.
- Auto-selected based on `Agent.language` set during onboarding.
- Fallback: if no `.hi.ts` exists for a template, use the English version with a Hindi system instruction prefix.

### L2. Code-switching is the norm — design for it
- Indian English ↔ Hindi happens mid-sentence ("Sir, aapka appointment book ho gaya"). Test Gemini Live handles it without resetting voice or accent.
- Add to `baseInstructions`: *"Respond in the language the caller used in their most recent message, including mid-sentence code-switching."*
- Voice selection: use Gemini's `Aoede` or `Charon` prebuilt voices which handle Hindi+English cleanly.

### L3. Owner dashboard i18n (Hindi → Marathi → Tamil)
- `next-intl` setup; translate onboarding wizard first (highest abandonment surface), then dashboard, then settings.
- Don't translate agent config field names — owners type in their own language anyway.

**Files:**
- `src/lib/agents/*.hi.ts` (5 new — one per shipped template)
- `src/lib/gemini/agent-prompts.ts` — language-aware prompt selection in `getAgentSystemPrompt`
- `src/messages/en.json`, `hi.json`, `mr.json`, `ta.json`
- `src/i18n.ts` + `middleware.ts` extension for locale routing

### Success metrics
- Hindi sessions match English completion rate within 10pp
- Hindi onboarding wizard completion ≥ 70% of starts
- Manual CSAT sample on 20 Hindi calls / month ≥ 4/5

---

## Phase M — Agency / multi-business / white-label (3–4 weeks)

Indian digital agencies (1-person Mumbai or Bangalore shops reselling Voxie to 30 local SMBs) are a huge channel. Today's schema has `User → Business → Agent` and the UI assumes 1:1 from User to Business. Loosen this.

### M1. Multi-business per User
- Prisma already lacks the constraint. The UI assumes one. Build a business switcher in the top nav.
- New role: `AGENCY_OWNER` on `User` — sees a unified portfolio view.

### M2. White-label
- `Business.brandConfig JSON`: `{ logoUrl, primaryColor, footerText, hidePoweredBy, customDomain }`.
- Embed widget reads brandConfig — agency clients see only their own brand.
- Custom subdomain support: `{tenant}.voxie.in` via wildcard DNS + middleware tenant resolution.
- Optional: full custom domain (`voice.client.com`) — agency provides DNS, we issue Let's Encrypt cert.

### M3. Agency dashboard
- Lists all client businesses with usage gauges, lead counts, monthly MRR contribution.
- Agency-level billing: agency pays one combined Razorpay invoice; per-client pricing is internal to the agency.
- Per-client RBAC: agency can grant the end-client **read-only** access to their own sessions + leads.

**Files:**
- Prisma: extend `User.role` enum; new `BusinessMember` join table ( `userId`, `businessId`, `role: OWNER | AGENCY_OWNER | CLIENT_READONLY` )
- `src/middleware.ts` — tenant resolution for `*.voxie.in` and custom domains
- `src/app/(business)/agency/*` — agency dashboard pages
- `src/lib/auth.ts` — multi-business session, business switcher state
- `src/lib/billing/agency.ts` — combined invoice math

### Success metrics
- Agencies with ≥ 5 client businesses retain at 90%+ MoM
- Onboarding flow length for agency-added clients ≤ 4 min (vs. 12+ min self-serve)

---

## Phase N — Reliability & ops moat (parallel work, 4–5 weeks total)

Sales blockers that show up once Voxie is in serious customer eval, especially for larger SMBs and agencies.

### N1. WebSocket reconnect (was in Phase 7 — already planned in README)
- Resumption handle is captured today but the reconnect path is unbuilt.
- Trigger: WebSocket close code 1006 / 1011, OR `navigator.onLine === false`.
- New Gemini session opened with `sessionResumption: { handle: <stored> }`. Audio resumes mid-turn.
- Browser-side state: queue local mic audio during the disconnect window (max 10s) so nothing is lost.

### N2. Webhook retry queue with dead-letter UI
- Today: outbound webhook retries are folded into Inngest's function-level retry — coarse.
- Move to a dedicated `WebhookDelivery` table + Inngest function `webhook/deliver` with explicit backoff (1m, 5m, 15m, 1h, 6h).
- Dead-letter UI on `/business/settings/webhooks`: failed deliveries listed with manual retry button + full request/response inspector.

### N3. Metered overage billing
- Hit 100% quota → instead of 429-and-refuse, allow overage at ₹X/minute (configurable per plan, default OFF).
- Month-end: Razorpay one-time charge for accumulated overage (Razorpay supports invoice-style one-time charges).
- Owner setting: hard cap (today's behavior — refuse) vs. soft cap (overage, with optional ₹ ceiling).

### N4. Audio call recording with consent + redaction
- Browser-side `MediaRecorder` captures mixed audio (mic + agent speaker output).
- POST to **Cloudflare R2** (cheaper India egress than S3) after the call ends.
- **Consent gate** on the pre-call screen: *"This call may be recorded for quality."* Caller can decline; recording is suppressed, call continues.
- Redaction pass post-call: regex (phone, email, PAN, Aadhaar formats) + Claude pass → store both `recordingRawUrl` and `recordingRedactedUrl`. Owners see redacted by default; raw requires explicit "show original" with audit log.
- Compliance: 30-day retention default; owner-configurable up to 1 year.

### N5. Status page + uptime SLA
- Public `status.voxie.in` (Better Stack or Statuspage.io).
- Per-component uptime: voice pipeline, dashboard, billing, integrations.
- SLAs: 99.5% on Starter, 99.9% on Growth+, with credit on missed months.

### Success metrics
- WebSocket reconnect P95 latency < 3s; recovered-call rate ≥ 70% on flaky networks
- Webhook DLQ size < 1% of total deliveries
- Recording opt-out < 5% (consent UX is non-blocking)
- SLA met every month after Phase N1+N2 ship

---

## India SMB pricing (revised for this roadmap)

| Plan | Min/mo | Agents | WhatsApp | Booking | CRM | Phone DID | Recording | Price (₹/mo) |
|---|---|---|---|---|---|---|---|---|
| **Free** | 30 | 1 | – | – | – | – | – | ₹0 |
| **Starter** | 200 | 3 | Outbound confirms | – | 1 connector | – | – | ₹999 |
| **Growth** | 800 | 10 | Outbound + Inbound | Google Calendar | 3 connectors | – | 7-day retention | ₹2,999 |
| **Pro** | 2,500 | Unlimited | Full WhatsApp suite | All providers | All connectors | 1 included | 30-day retention | ₹7,999 |
| **Agency** | Custom | Unlimited | Full | Full | Full | Up to 10 | 90-day retention | ₹19,999+ |

After this lands, **re-seed Razorpay plans** via an extended `prisma/seed-plans.mjs` so the price IDs pick up the new tiers.

---

## Sequencing summary

```
Months 1-2:   Phase G (WhatsApp outbound + inbound)   ← unblocks 70% of India demos
              Phase L1 (Hindi prompt rewrites)         ← parallel, low risk, big perceived quality bump

Months 2-3:   Phase H (Calendar booking)               ← highest MRR for clinics / salons / real-estate
              Phase I (CRM push: Zoho first)           ← parallel; one provider per week

Month 4:      Phase K (UPI mid-call payments)          ← quick win; builds on shipped Razorpay
              Phase N1 (WebSocket reconnect)           ← reliability prerequisite for J

Months 5-6:   Phase J (Twilio inbound DIDs)            ← heaviest infra; gate on N1 + budget for Fly.io
              Phase L2-L3 (code-switching + dash i18n)

Months 6-7:   Phase M (Agency + white-label)           ← after we have agency-scale features worth white-labeling

Always-on:    Phase N2-N5 (reliability + ops moat)     ← woven into other phases as customers escalate
```

---

## What we deliberately defer

- **WhatsApp voice notes (not text)** — Meta API allows it but UX adds complexity (push-to-talk vs. continuous streaming). Re-evaluate after Phase G text mode lands and we see actual usage shape.
- **Custom voice cloning** — sounds like a moat; Gemini's prebuilt voices are good enough for SMB. Revisit at ₹10K MRR/customer.
- **Eval harness** — needed eventually but not blocking sales today. Build when prompt-regression bugs cost more than one customer/month.
- **HubSpot / Salesforce connectors** — keep on backlog for the eventual enterprise tier; Indian SMB doesn't run on these. Re-evaluate when we land our first US enterprise customer.
- **LangGraph** — postpone until the booking workflow (H2) feels like a state machine. Today it's a 2-step tool dance; that's fine without LangGraph overhead.
- **Multi-region deploy** — premature until P95 latency tells us Mumbai customers feel the US Vercel edge. India-region Postgres on Neon already helps; revisit when call latency > 800 ms P95.

---

## File impact summary — Phases G–N

| Category | New files | Modified files |
|---|---|---|
| WhatsApp | `src/lib/whatsapp/{gupshup,twilio,index}.ts`, `src/app/api/whatsapp/inbound/route.ts`, `src/lib/gemini/text-session.ts`, `/business/agents/[id]/whatsapp/page.tsx` | `src/lib/lead-delivery.ts`, `prisma/schema.prisma`, `/business/settings/page.tsx` |
| Booking | `src/lib/calendar/{google,calendly,index}.ts`, `src/app/api/integrations/google-calendar/{connect,callback}/route.ts`, `src/app/api/integrations/calendly/{connect,callback}/route.ts`, `src/app/api/public/agent/[slug]/{book-appointment,confirm-appointment}/route.ts` | `src/lib/gemini/agent-prompts.ts`, `src/lib/gemini/live-session.ts`, `src/lib/agents/{medical,legal,hotel}-agent.ts`, `prisma/schema.prisma` |
| CRM | `src/lib/crm/{leadsquared,zoho,kylas,index}.ts`, `src/lib/crypto.ts` | `src/lib/lead-delivery.ts`, `prisma/schema.prisma`, `/business/settings/integrations/crm/page.tsx` (new) |
| Telephony | `src/app/api/twilio/voice/incoming/route.ts`, `src/lib/telephony/twilio-bridge.ts`, separate Fly.io WebSocket service | `prisma/schema.prisma`, infra config (`fly.toml`) |
| Payments | `src/lib/payments/razorpay-payment-link.ts`, `src/app/api/public/agent/[slug]/payment-link/route.ts` | `src/lib/gemini/agent-prompts.ts`, `src/app/api/billing/razorpay/webhook/route.ts`, `prisma/schema.prisma` |
| Multilingual | `src/lib/agents/*.hi.ts`, `src/messages/{en,hi,mr,ta}.json`, `src/i18n.ts` | `src/lib/gemini/agent-prompts.ts`, `src/middleware.ts` |
| Agency | `src/app/(business)/agency/*`, `src/lib/billing/agency.ts` | `prisma/schema.prisma`, `src/middleware.ts`, `src/lib/auth.ts` |
| Reliability | `WebhookDelivery` model + Inngest function `webhook/deliver`, `src/lib/recording/{capture,redact}.ts`, R2 client | `src/lib/gemini/live-session.ts` (reconnect path), `src/lib/lead-delivery.ts` |
