# AgentHub — Template-Specific Agent Implementation Plan

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
