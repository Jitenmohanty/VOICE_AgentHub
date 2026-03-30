# AgentHub — Multi-Tenant Voice AI Platform

## Overview

AgentHub is a full-stack multi-tenant SaaS platform where businesses create AI-powered voice agents for their customers. A hotel owner uploads their room details and FAQs, and customers call the AI concierge through a shareable link — no app download, no login required.

**Built with:** Next.js 16 | TypeScript | Gemini Live API | Claude API | pgvector on Neon | Prisma | NextAuth v5 | Zustand | Tailwind CSS | LangSmith

---

## Two User Types

### Business Owner
- Registers with email/password or Google OAuth
- Picks an industry template (Hotel, Medical, Restaurant, Interview, Legal)
- Configures their AI agent: name, greeting, personality, rules
- Uploads knowledge (FAQs, policies, documents)
- Adds structured data (rooms, menu items, services, pricing)
- Gets a public shareable link: `agenthub.com/a/{business-slug}`
- Reviews customer conversations with AI-generated analysis

### End Customer
- Visits the public agent link (no login required)
- Clicks "Start Call" to begin a voice conversation
- Talks to the business's AI agent powered by Gemini Live API
- Optionally rates the experience after the call

---

## Architecture

```
Customer visits /a/{slug}
       |
       v
┌──────────────────────────────────────────┐
│         PUBLIC AGENT PAGE                 │
│    No auth • Click to talk • Rating       │
└──────────────┬───────────────────────────┘
               |
               v
┌──────────────────────────────────────────┐
│     SERVER: Build Dynamic Prompt          │
│                                           │
│  Template prompt (hotel/medical/etc.)     │
│  + Owner customizations (personality,     │
│    greeting, rules)                       │
│  + Business info (name, phone, address)   │
│  + Structured data (rooms, menu, etc.)    │
│  + RAG context from pgvector search       │
└──────────────┬───────────────────────────┘
               |
               v
┌──────────────────────────────────────────┐
│     GEMINI LIVE API (Voice)               │
│     Model: gemini-3.1-flash-live-preview  │
│     Real-time WebSocket audio streaming   │
│     VAD • Interruption handling           │
│     Input: 16kHz PCM16 mono               │
│     Output: 24kHz PCM16 audio             │
└──────────────┬───────────────────────────┘
               |
          Call ends
               |
               v
┌──────────────────────────────────────────┐
│     CLAUDE API (Post-Call Analysis)        │
│     Model: claude-sonnet-4                │
│                                           │
│  Generates:                               │
│  • Conversation summary                   │
│  • Sentiment (positive/negative/mixed)    │
│  • Sentiment score (-1.0 to 1.0)          │
│  • Action items with priority             │
│  • Topic extraction                       │
│  • Escalation detection                   │
└──────────────┬───────────────────────────┘
               |
               v
┌──────────────────────────────────────────┐
│     LANGSMITH (Observability)             │
│     Traces: Claude calls, embeddings,     │
│     RAG queries, post-call analysis       │
└──────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Styling | Tailwind CSS 4 + Framer Motion |
| Auth | NextAuth v5 (Google OAuth + Credentials) |
| Database | PostgreSQL on Neon (serverless) |
| ORM | Prisma 7.6 with Neon HTTP adapter |
| Vector Search | pgvector extension (cosine similarity) |
| Voice AI | Google Gemini 3.1 Flash Live API (`@google/genai`) |
| Post-Call AI | Anthropic Claude Sonnet 4 (`@anthropic-ai/sdk`) |
| Embeddings | Gemini text-embedding-004 (768 dimensions) |
| State Management | Zustand |
| UI Components | shadcn/ui + Radix primitives |
| Icons | Lucide React |
| Observability | LangSmith (traceable wrappers) |
| Notifications | Sonner (toast) |

---

## Database Schema

```
User (auth + role)
  └── Business (name, slug, industry, contact info)
       └── Agent (template, prompt, personality, rules, config)
            ├── KnowledgeItem (title, content, category, pgvector embedding)
            ├── BusinessData (dataType, structured JSON)
            └── AgentSession (anonymous caller, transcript, AI analysis)
```

### Key Models

**Business** — The tenant. Has a unique slug for the public URL. One owner (User).

**Agent** — The AI voice agent. Linked to an industry template. Customizable system prompt, greeting, personality, rules. Supports structured config (hotelName, cuisineType, etc.).

**KnowledgeItem** — FAQs, policies, documents stored with pgvector embeddings for RAG. Categories: faq, policy, menu, service, general.

**BusinessData** — Structured JSON data (room listings, menu items, doctor schedules, pricing). Keyed by `dataType` per agent.

**AgentSession** — Every voice conversation. Anonymous callers (no user FK). Stores transcript, duration, rating. Post-call: Claude-generated summary, sentiment, action items, topics, escalation flag.

---

## Industry Templates

| Template | Use Case | Default Data Types |
|----------|----------|-------------------|
| **Hotel** | Concierge for bookings, room service, guest inquiries | rooms, services, amenities, policies |
| **Medical** | Patient support for appointments, pre-screening, FAQ | doctors, services, hours, insurance |
| **Interview** | Mock tech interviews with scoring and feedback | question_bank, evaluation_criteria |
| **Restaurant** | Voice ordering, reservations, menu questions | menu_items, hours, specials, reservation_policy |
| **Legal** | General legal information, procedure guidance | practice_areas, attorneys, fee_structure |

Each template provides: default system prompt, greeting, personality, configurable fields, suggested knowledge categories, and tool declarations.

---

## Features

### Voice Agent
- Real-time voice conversations via Gemini Live API WebSocket
- Audio capture via AudioWorklet (16kHz PCM16 mono)
- Audio playback via Web Audio API (24kHz, queued scheduling)
- Live transcript with input/output transcription
- Audio visualizer (frequency bars on canvas)
- Animated agent avatar with speaking/listening/idle states
- Mute/unmute, session timer, end call
- Interruption handling (barge-in support)
- Session saved on browser close via `beforeunload` + `keepalive` fetch

### RAG Pipeline
- Knowledge items embedded via Gemini text-embedding-004
- Stored in pgvector (768-dimension vectors)
- Cosine similarity search scoped to agent
- Context injected into system prompt at session start
- Structured business data also injected into prompt
- Embeddings generated asynchronously (fire-and-forget on create/update)

### Post-Call Intelligence (Claude)
- Triggered automatically when session status = "completed"
- Deduplication guard (skips if already analyzed)
- Generates: summary, sentiment, sentimentScore, action items, topics, escalated flag
- Results stored on AgentSession and displayed in session detail modal

### Business Dashboard
- Overview with business info, public link (copy button), agent stats
- Agent configuration: name, greeting, personality, rules, system prompt override
- Knowledge base management: CRUD with inline editing, category filtering
- Structured data editor: JSON editor for rooms/menu/services
- Session history: paginated, clickable, with AI analysis display
- Business settings: profile, contact info, public URL

### Authentication
- NextAuth v5 with JWT strategy
- Providers: Google OAuth, Credentials (email/password with bcrypt)
- Role-based: BUSINESS_OWNER, ADMIN
- Middleware: `/business/*` protected, `/a/*` public
- 2-step registration: account details then business name + industry picker

---

## API Routes

### Auth
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/register` | Public | Register user + create business + agent |
| * | `/api/auth/[...nextauth]` | Public | NextAuth handlers |

### Business
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/business` | Owner | List owner's businesses |
| GET | `/api/business/[id]` | Owner | Business details |
| PATCH | `/api/business/[id]` | Owner | Update business profile |

### Agents
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/business/[id]/agents` | Owner | List agents |
| POST | `/api/business/[id]/agents` | Owner | Create agent from template |
| GET | `/api/business/[id]/agents/[id]` | Owner | Agent details + stats |
| PATCH | `/api/business/[id]/agents/[id]` | Owner | Update config/prompt/rules |
| DELETE | `/api/business/[id]/agents/[id]` | Owner | Deactivate agent |

### Knowledge Base
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/business/[id]/agents/[id]/knowledge` | Owner | List items |
| POST | `/api/business/[id]/agents/[id]/knowledge` | Owner | Create + embed |
| PATCH | `/api/business/[id]/agents/[id]/knowledge/[id]` | Owner | Update + re-embed |
| DELETE | `/api/business/[id]/agents/[id]/knowledge/[id]` | Owner | Delete item |

### Business Data
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/business/[id]/agents/[id]/data` | Owner | List data types |
| POST | `/api/business/[id]/agents/[id]/data` | Owner | Upsert data type |
| DELETE | `/api/business/[id]/agents/[id]/data/[type]` | Owner | Delete data |

### Sessions
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/sessions` | Owner | All sessions (scoped to owner's agents) |
| GET | `/api/sessions/[id]` | Owner | Session detail with agent info |
| PATCH | `/api/sessions/[id]` | Owner | Update + trigger Claude analysis |
| DELETE | `/api/sessions/[id]` | Owner | Delete session |
| GET | `/api/business/[id]/agents/[id]/sessions` | Owner | Sessions for specific agent |

### Public (No Auth Required)
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/public/agent/[slug]` | None | Public agent info |
| POST | `/api/public/agent/[slug]/session` | None | Create anonymous session + get API key + RAG-enhanced prompt |
| PATCH | `/api/public/agent/[slug]/session/[id]` | None | Update session (transcript, rating) + trigger analysis |

### Internal
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/internal/post-call` | Internal | Claude post-call analysis |
| POST | `/api/gemini/session` | Owner | Legacy: create voice session |

---

## Pages

### Public
| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | 2-step: account + business setup |
| `/a/[slug]` | Customer-facing voice agent page (no auth) |

### Business Owner (Protected)
| Route | Purpose |
|-------|---------|
| `/business/dashboard` | Overview, public link, agent stats |
| `/business/agents` | List and manage agents |
| `/business/agents/[id]` | Agent config: greeting, personality, rules, prompt |
| `/business/agents/[id]/knowledge` | Knowledge base CRUD |
| `/business/agents/[id]/data` | Structured data editor |
| `/business/agents/[id]/sessions` | Session history for this agent |
| `/business/sessions` | All sessions across agents |
| `/business/settings` | Business profile editor |

### Legacy (Redirects)
| Route | Redirects to |
|-------|-------------|
| `/dashboard` | `/business/dashboard` |

---

## Environment Variables

```env
# Voice AI
GOOGLE_GEMINI_API_KEY=           # Gemini Live API + embeddings

# Post-Call Intelligence
ANTHROPIC_API_KEY=               # Claude post-call analysis

# Auth
NEXTAUTH_SECRET=                 # JWT signing secret
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=                     # Same as NEXTAUTH_SECRET
GOOGLE_CLIENT_ID=                # Google OAuth
GOOGLE_CLIENT_SECRET=            # Google OAuth

# Database
DATABASE_URL=                    # Neon PostgreSQL connection string

# Observability (optional)
LANGSMITH_TRACING=true           # Enable/disable tracing
LANGSMITH_API_KEY=               # From smith.langchain.com
LANGSMITH_PROJECT=agenthub       # Project name in LangSmith
```

---

## Project Structure

```
agenthub/
├── prisma/
│   └── schema.prisma              # Multi-tenant database schema
├── public/
│   └── audio-capture-worklet.js   # AudioWorklet for mic capture
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login, Register (2-step)
│   │   ├── (business)/            # Business owner dashboard
│   │   │   └── business/
│   │   │       ├── dashboard/     # Overview + public link
│   │   │       ├── agents/        # Agent list + config
│   │   │       │   └── [agentId]/ # Config, knowledge, data, sessions
│   │   │       ├── sessions/      # All sessions view
│   │   │       └── settings/      # Business profile
│   │   ├── (dashboard)/           # Legacy dashboard (redirects)
│   │   ├── a/[slug]/              # PUBLIC customer voice page
│   │   └── api/
│   │       ├── auth/              # NextAuth + register
│   │       ├── business/          # Business + agent CRUD
│   │       ├── public/agent/      # Anonymous session endpoints
│   │       ├── sessions/          # Session CRUD
│   │       ├── gemini/            # Legacy voice session
│   │       └── internal/          # Post-call analysis webhook
│   ├── components/
│   │   ├── agent/                 # Voice UI: avatar, visualizer, transcript, controls
│   │   ├── business/              # Business dashboard components
│   │   ├── dashboard/             # Session history, detail modal, rating
│   │   ├── landing/               # Hero, features, showcase, CTA
│   │   ├── shared/                # Sidebar, navbar, loading states
│   │   └── ui/                    # shadcn/ui primitives
│   ├── hooks/
│   │   ├── useGeminiLive.ts       # Core voice session hook
│   │   ├── useAudioStream.ts      # Mic capture + resampling
│   │   ├── useAgent.ts            # Agent state
│   │   └── useTranscript.ts       # Transcript state
│   ├── lib/
│   │   ├── agents/                # 5 agent template modules
│   │   ├── gemini/                # Live session, prompts, audio utils
│   │   ├── auth.ts                # NextAuth config with roles
│   │   ├── claude.ts              # Claude API (traced via LangSmith)
│   │   ├── db.ts                  # Prisma client (Neon adapter)
│   │   ├── embeddings.ts          # Gemini embeddings (traced)
│   │   ├── langsmith.ts           # LangSmith client + flush utility
│   │   ├── post-call.ts           # Fire-and-forget analysis trigger
│   │   ├── rag.ts                 # pgvector search + context builder (traced)
│   │   ├── slug.ts                # Unique slug generation
│   │   ├── summary.ts             # Client-side summary generation
│   │   └── templates.ts           # Industry template registry
│   ├── stores/
│   │   ├── agent-store.ts         # Zustand: active agent state
│   │   └── session-store.ts       # Zustand: voice session state
│   └── types/
│       ├── agent.ts               # Agent types
│       ├── gemini.ts              # Gemini API types
│       ├── next-auth.d.ts         # NextAuth type augmentation
│       └── session.ts             # Session types
├── PRODUCT.md                     # This file
├── CLAUDE.md                      # AI assistant instructions
└── package.json
```

---

## Development

```bash
# Install dependencies
npm install

# Setup database
npx prisma db push
npx prisma generate

# Enable pgvector
npx tsx --env-file=.env.local prisma/enable-pgvector.ts

# Run dev server
npm run dev

# Build
npm run build
```

---

## How It Works (End-to-End)

### Business Setup
1. Owner registers with business name + industry template
2. System creates: User + Business (with unique slug) + Agent (with template defaults)
3. Owner configures agent: greeting, personality, custom rules
4. Owner adds knowledge: FAQs, policies → embedded via Gemini → stored in pgvector
5. Owner adds structured data: room listings, menu items, pricing
6. Owner shares public link: `/a/{business-slug}`

### Customer Call
1. Customer visits `/a/{slug}` — no login needed
2. Clicks "Start Call"
3. Server builds dynamic system prompt:
   - Base template prompt for the industry
   - Owner's personality, greeting, rules
   - Business info (name, phone, address)
   - Structured data (rooms, menu, etc.)
   - RAG results from pgvector knowledge search
4. WebSocket connection to Gemini Live API established
5. Real-time voice conversation with live transcript
6. Customer ends call → session saved with transcript + duration

### Post-Call
1. Session PATCH triggers fire-and-forget call to `/api/internal/post-call`
2. Claude analyzes the transcript
3. Generates: summary, sentiment, action items, topics, escalation flag
4. Results stored on AgentSession
5. Business owner sees analysis in session detail view
6. All operations traced via LangSmith

---

## Implementation Phases (Completed)

| Phase | What | Status |
|-------|------|--------|
| 1 | Multi-tenant schema, auth roles, business/agent models, registration, public routes | Done |
| 2 | Business dashboard, agent config UI, knowledge CRUD, data CRUD, sessions, settings | Done |
| 3 | Gemini embeddings, pgvector RAG pipeline, dynamic prompt injection | Done |
| 4 | Claude post-call analysis (sentiment, topics, action items), dedup guard | Done |
| 5 | LangSmith observability on Claude, embeddings, RAG queries | Done |

---

## Future Roadmap

- [ ] Analytics dashboard with charts (sessions/day, sentiment distribution, top topics)
- [ ] Document upload (PDF/DOCX) with Claude-powered chunking
- [ ] Embed widget for business websites
- [ ] QR code generation for physical locations
- [ ] Multi-agent support per business
- [ ] Webhook integrations (notify on escalation, new session)
- [ ] LangGraph for complex multi-step workflows (booking flow, order flow)
- [ ] Rate limiting on public endpoints
- [ ] Ephemeral tokens instead of raw API key to client
- [ ] Multi-language support with Gemini language detection
- [ ] Mobile-responsive voice interface improvements
- [ ] Admin panel for platform management
