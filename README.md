# AgentHub — Multi-Tenant Voice AI Platform

> Build, deploy, and manage AI voice agents for any business. Powered by Gemini Live API, Claude AI, and RAG.

AgentHub lets **business owners** create AI voice agents trained on their own data — menus, room inventory, policies, FAQs — and share them with **customers** via a link, embed widget, or QR code. No AI expertise required.

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                  END CUSTOMER                        │
│  (voice call via shared link / embed / QR code)      │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│            GEMINI LIVE API (Real-time Voice)          │
│     System prompt built from business data + RAG     │
│     Tool calls → business-specific functions          │
└──────────┬─────────────────────────────┬─────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────┐   ┌────────────────────────────┐
│  VECTOR DB           │   │  CLAUDE API (Smart Layer)  │
│  (pgvector / Neon)   │   │  - Summarize conversations │
│  Business knowledge, │   │  - Extract action items    │
│  FAQs, policies      │   │  - Sentiment analysis      │
└─────────────────────┘   └────────────────────────────┘
           │                             │
           └─────────────┬───────────────┘
                         ▼
┌──────────────────────────────────────────────────────┐
│              POSTGRESQL (Neon)                         │
│  Businesses, Agents, Knowledge, Sessions, Analytics   │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│            LANGSMITH (Observability)                   │
│  Trace conversations, latency, token usage, errors    │
└──────────────────────────────────────────────────────┘
```

---

## Two User Types

| Role | What they do |
|------|-------------|
| **Business Owner** | Registers, configures their AI agent via guided onboarding, adds FAQs/knowledge, shares public link with customers |
| **End Customer** | Calls the business's agent via shared link, embed widget, or QR code — **no login required** |

---

## Business Owner Onboarding Flow

After signup, business owners complete a **4-step guided wizard** before reaching the dashboard.

### Credentials Registration (`/register`)
```
/register
  → POST /api/auth/register
      Creates: User + Business + Agent (defaults from industry template)
  → Redirect: /business/onboarding
```

### Google / GitHub OAuth
```
OAuth provider callback
  → Creates: User only (no business yet)
  → Redirect: /business/onboarding
```

---

### Onboarding Wizard (`/business/onboarding`)

#### Step 1 — Business Details
- Business name, industry picker (5 cards: Hotel / Restaurant / Medical / Legal / Interview)
- Description, phone, website, address
- **OAuth users:** full business creation here
- **Credentials users:** review & complete details (business + agent already created at register)
- Saves to `Business` table

#### Step 2 — Configure Agent
- Agent name, greeting message, personality & tone
- **Dynamic industry fields:**
  - Hotel → Hotel name, hotel type
  - Restaurant → Restaurant name, cuisine
  - Interview → Tech stack, level, company
  - Medical → Clinic name, specialty
  - Legal → Jurisdiction, legal area
- Saves to `Agent` table (`config` JSON + `greeting` / `personality`)

#### Step 3 — Add FAQs
- Industry-specific suggestion chips (click to pre-fill):
  - Hotel: check-in time, parking, cancellation, Wi-Fi, room service
  - Restaurant: hours, reservations, dietary options, delivery
  - Medical: appointment booking, insurance, emergency contact
  - Legal: consultation fees, case types, jurisdiction
- Add question + answer inline
- "Skip & Finish" available
- Saves to `KnowledgeItem` table (with vector embedding for RAG)

#### Step 4 — Go Live!
- Public link: `agenthub.com/a/{business-slug}`
- Copy link button
- "Test Your Agent" → opens `/a/{slug}` in new tab
- "Go to Dashboard" → `/dashboard`

---

### End Customer Flow

1. Visit shared link / scan QR / click embed widget — **no login required**
2. Click "Start Call"
3. Talk to the business's AI agent (answers from real business FAQs and data)
4. Optionally rate the experience

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Voice AI | Gemini Live API (`gemini-3.1-flash-live-preview`) via `@google/genai` SDK |
| Smart Layer | Claude API (summaries, knowledge processing, fallback) |
| Database | PostgreSQL on Neon (serverless) |
| ORM | Prisma 7 with `@prisma/adapter-neon` |
| Vector Search | pgvector on Neon (RAG for business knowledge) |
| Auth | NextAuth v5 (JWT strategy, Prisma adapter) |
| State | Zustand |
| UI | Tailwind CSS 4, shadcn/ui, Framer Motion, Lucide icons |
| Observability | LangSmith (tracing, monitoring) |
| Audio | Web Audio API, AudioWorklet (16kHz PCM capture, 24kHz PCM playback) |

---

## Database Schema

```
User
├── id, name, email, password (nullable for OAuth)
├── role: BUSINESS_OWNER | ADMIN
├── accounts[] → Account (OAuth providers)
└── businesses[] → Business

Business (tenant)
├── id, name, slug (unique, used in public URL)
├── ownerId → User
├── industry (hotel/restaurant/medical/legal/interview)
├── description, phone, website, address, logoUrl
├── isActive
└── agents[] → Agent

Agent (one per business, expandable)
├── id, businessId → Business
├── templateType (matches industry)
├── name, description, greeting, personality, rules
├── systemPrompt (auto-generated, editable)
├── config (JSON — industry-specific fields)
├── enabledTools[] (tool function names)
├── voiceName, language
├── knowledgeItems[] → KnowledgeItem
├── businessData[] → BusinessData
└── agentSessions[] → AgentSession

KnowledgeItem (RAG source — FAQs, documents)
├── id, agentId → Agent
├── title, content, category
├── sourceType: TEXT | DOCUMENT | STRUCTURED
├── embedding (pgvector 768-dim — for semantic search)
├── metadata (JSON)
└── isActive

BusinessData (structured operational data)
├── id, agentId → Agent
├── dataType (rooms/menu/services/policies/pricing)
└── data (JSON — flexible per industry)
       unique per [agentId, dataType]

AgentSession (conversation record — anonymous callers)
├── id, agentId → Agent
├── callerName, callerPhone, callerEmail (optional)
├── title, transcript (JSON), duration, status
├── summary, sentiment, sentimentScore (AI-generated)
├── actionItems (JSON), topics[], escalated
└── rating, feedback
```

---

## Project Structure

```
src/
├── app/
│   ├── (agents)/agent/[agentType]/   # Voice agent interface (public)
│   ├── (auth)/
│   │   ├── login/                    # Login page
│   │   └── register/                 # Registration + business/industry form
│   ├── (dashboard)/dashboard/        # Owner dashboard, history, settings
│   ├── business/
│   │   └── onboarding/               # 4-step guided onboarding wizard
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/        # NextAuth handler
│       │   └── register/             # Credentials registration (creates User+Business+Agent)
│       ├── gemini/session/           # Issues API key + creates AgentSession
│       └── sessions/                 # AgentSession CRUD + [id]/ detail
├── components/
│   ├── agent/                        # VoiceInterface, AudioVisualizer, TranscriptPanel, ControlBar
│   ├── dashboard/                    # AgentGrid, AgentCard, SessionHistory, UserStats, ConfigModal, RatingModal
│   ├── landing/                      # Hero, Features, AgentShowcase, CTA
│   ├── shared/                       # Navbar, Sidebar, ErrorBoundary, LoadingStates
│   └── ui/                           # shadcn/ui primitives (button, card, dialog, etc.)
├── hooks/
│   ├── useGeminiLive.ts              # Voice session lifecycle (connect, send audio, disconnect)
│   ├── useAudioStream.ts             # Microphone capture via AudioWorklet (16kHz PCM)
│   ├── useTranscript.ts              # Transcript state management
│   └── useAgent.ts                   # Agent config fetching
├── lib/
│   ├── gemini/
│   │   ├── live-session.ts           # Gemini Live WebSocket session class
│   │   ├── audio-utils.ts            # PCM conversion, sequential audio playback
│   │   ├── agent-prompts.ts          # System prompt builder + tool definitions
│   │   └── client.ts                 # GoogleGenAI client factory
│   ├── agents/                       # Industry-specific agent configs (hotel, restaurant, etc.)
│   ├── auth.ts                       # NextAuth config (Google, GitHub, Credentials)
│   ├── db.ts                         # Prisma client (Neon HTTP adapter)
│   ├── slug.ts                       # Unique slug generator for businesses
│   └── templates.ts                  # Industry template definitions (fields, defaults, tools)
├── stores/
│   ├── agent-store.ts                # Agent config state (Zustand)
│   └── session-store.ts             # Voice session + transcript state (Zustand)
├── types/                            # TypeScript types (agent, session, gemini)
└── proxy.ts                          # Next.js middleware (renamed for Next.js 16 compatibility)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd agenthub
npm install

# Configure environment
cp .env.example .env.local
```

Add your keys to `.env.local`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# OAuth providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Gemini Live API (Voice AI)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

# Claude API (Smart layer — Phase 5+)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# LangSmith (Observability — Phase 8)
LANGSMITH_API_KEY="your-langsmith-key"
```

```bash
# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random secret for NextAuth session encryption |
| `NEXTAUTH_URL` | Yes | App URL (`http://localhost:3000` in dev) |
| `GOOGLE_CLIENT_ID` | OAuth | Google Cloud Console OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google Cloud Console OAuth 2.0 client secret |
| `GITHUB_CLIENT_ID` | OAuth | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | OAuth | GitHub OAuth App client secret |
| `GOOGLE_GEMINI_API_KEY` | Yes | Google AI Studio API key for Gemini Live |
| `ANTHROPIC_API_KEY` | Phase 5+ | Claude API key for summaries & knowledge processing |
| `LANGSMITH_API_KEY` | Phase 8 | LangSmith key for observability |

> **Google OAuth redirect URI:** Add `http://localhost:3000/api/auth/callback/google` in Google Cloud Console → Credentials → Authorized redirect URIs.

---

## Implementation Roadmap

| Phase | What | Status |
|-------|------|--------|
| **Phase 1** | Multi-tenant foundation — User + Business + Agent schema, credentials/OAuth auth, guided 4-step onboarding wizard | ✅ Done |
| **Phase 2** | Business knowledge base — FAQ upload, pgvector embeddings, semantic RAG retrieval | 🔄 In Progress |
| **Phase 3** | Dynamic agent prompts — system prompt built from real business data + RAG context at call time | Planned |
| **Phase 4** | Public agent links — shareable `/a/{slug}`, embed widget, QR code, no-auth customer access | Planned |
| **Phase 5** | Claude post-call intelligence — AI summary, sentiment analysis, action item extraction | Planned |
| **Phase 6** | Business dashboard — analytics, session review, knowledge management UI | Planned |
| **Phase 7** | LangGraph workflows — multi-step booking/ordering flows with state machines | Planned |
| **Phase 8** | LangSmith observability — conversation tracing, latency, token usage, error monitoring | Planned |

### What's Built (Phase 1)

- **Auth** — Email/password registration + Google/GitHub OAuth (NextAuth v5)
- **Multi-tenant schema** — `User → Business → Agent → KnowledgeItem / BusinessData / AgentSession`
- **Guided onboarding wizard** — 4-step flow for both OAuth and credentials users
  - Step 1: Business details + industry selection
  - Step 2: Agent configuration with industry-specific fields
  - Step 3: FAQ entry with suggestion chips per industry
  - Step 4: Go live with shareable link
- **Voice interface** — Real-time bidirectional voice via Gemini Live API (WebSocket)
- **Audio pipeline** — 16kHz PCM capture (AudioWorklet) + 24kHz sequential playback
- **Transcription** — SDK-level input/output transcription displayed live
- **5 industry templates** — Hotel, Restaurant, Medical, Legal, Interview (each with custom fields, tools, and defaults)
- **Session recording** — AgentSession created per call with transcript and metadata

---

## Key Components

### Voice Pipeline

1. **Microphone capture** → AudioWorklet resamples to 16kHz mono PCM
2. **Gemini Live API** → Real-time bidirectional voice over WebSocket
3. **Audio playback** → Sequential scheduling at 24kHz, prevents chunk overlap
4. **Transcription** → SDK-level input/output transcription for transcript panel

### Agent System

Each industry template defines:
- **System prompt** — personality, knowledge domain, response style
- **Tool declarations** — business-specific functions (check availability, place order, etc.)
- **Tool handlers** — execute tool calls and return structured results

---

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## License

Private project — not open source.
