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
| **Business Owner** | Registers, uploads business data (hotel rooms, menu, policies, FAQs), configures their AI agent, views analytics |
| **End Customer** | Calls/chats with a business's agent via embed widget, shared link, or QR code — **no login required** |

---

## User Flows

### Business Owner
1. **Sign up** → Choose industry (Hotel / Restaurant / Medical / Legal / Custom)
2. **Business setup** → Upload knowledge (FAQs, menus, policies) or fill structured forms
3. **Agent customization** → Preview auto-generated prompt, choose voice/personality, enable tools, test agent
4. **Go live** → Get shareable link (`agenthub.com/a/grand-hotel`), embed widget, or QR code
5. **Dashboard** → Live sessions, analytics, action items, knowledge management

### End Customer
1. Visit link / scan QR / click embed widget
2. Click "Start Call" — no login needed
3. Talk to the business's AI agent (answers from real business data)
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
Business (tenant)
├── id, name, slug, logo, description
├── industry (hotel/medical/restaurant/legal/custom)
├── ownerId → User
├── plan (free/pro/enterprise)
├── settings (timezone, language, voice preference)
└── createdAt

Agent (one or more per business)
├── id, businessId → Business
├── name, avatar, accentColor
├── systemPromptTemplate (editable by owner)
├── voiceId, isPublic, publicSlug
└── tools[] (enabled tool functions)

KnowledgeBase (RAG source)
├── id, businessId → Business
├── type (faq/document/structured)
├── content, embedding (pgvector)
└── metadata (category, tags)

BusinessData (structured info)
├── id, businessId → Business
├── category (rooms/menu/services/policies/pricing)
└── data (JSON — flexible per industry)

Session (conversation record)
├── id, agentId → Agent
├── customerName, customerPhone (optional)
├── title, summary (AI-generated)
├── transcript, duration, rating, sentiment
├── actionItems[] (extracted by Claude)
└── status (active/completed/missed)

User
├── id, email, name, role (owner/customer/admin)
└── businessId? (if owner)
```

---

## Project Structure

```
src/
├── app/
│   ├── (agents)/agent/[agentType]/   # Voice agent interface
│   ├── (auth)/login, register/       # Authentication pages
│   ├── (dashboard)/dashboard/        # Owner dashboard, history, settings
│   └── api/
│       ├── auth/                     # NextAuth routes
│       ├── gemini/session/           # API key provisioning for voice
│       └── sessions/                 # Session CRUD
├── components/
│   ├── agent/                        # VoiceInterface, AudioVisualizer, TranscriptPanel
│   ├── dashboard/                    # AgentGrid, SessionHistory, UserStats
│   ├── landing/                      # Hero, Features, AgentShowcase
│   ├── shared/                       # Navbar, Sidebar, ErrorBoundary
│   └── ui/                           # shadcn/ui primitives
├── hooks/
│   ├── useGeminiLive.ts              # Voice session management
│   ├── useAudioStream.ts            # Microphone capture via AudioWorklet
│   └── useTranscript.ts             # Transcript state
├── lib/
│   ├── gemini/
│   │   ├── live-session.ts           # Gemini Live WebSocket session
│   │   ├── audio-utils.ts           # PCM conversion, playback
│   │   └── agent-prompts.ts         # System prompts, tool definitions
│   ├── agents/                       # Industry-specific agent configs
│   ├── auth.ts                       # NextAuth configuration
│   └── db.ts                         # Prisma client
├── stores/                           # Zustand stores
└── types/                            # TypeScript type definitions
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
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Gemini (Voice AI)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

# Claude (Smart layer — Phase 5+)
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
| `GOOGLE_GEMINI_API_KEY` | Yes | Google AI Studio API key for Gemini Live |
| `ANTHROPIC_API_KEY` | Phase 5+ | Claude API key for summaries & knowledge processing |
| `LANGSMITH_API_KEY` | Phase 8 | LangSmith key for observability |

---

## Implementation Roadmap

| Phase | What | Status |
|-------|------|--------|
| **Phase 1** | Multi-tenant foundation (schema, business CRUD, auth roles) | Planned |
| **Phase 2** | Business knowledge base (upload, embed, pgvector RAG) | Planned |
| **Phase 3** | Dynamic agent prompts (built from business data + RAG) | Planned |
| **Phase 4** | Public agent links (shareable, embeddable, no-auth customer access) | Planned |
| **Phase 5** | Claude post-call intelligence (summary, sentiment, action items) | Planned |
| **Phase 6** | Business dashboard (analytics, session review, knowledge management) | Planned |
| **Phase 7** | LangGraph workflows (multi-step booking/ordering flows) | Planned |
| **Phase 8** | LangSmith observability (tracing, monitoring) | Planned |

### What's Built So Far

- Real-time voice conversations via Gemini Live API (WebSocket)
- Audio capture (16kHz PCM) and playback (24kHz PCM) via AudioWorklet
- Input/output transcription (speech-to-text for both user and agent)
- 5 industry agent templates (Hotel, Medical, Restaurant, Legal, Interview)
- Authentication (email/password with NextAuth v5)
- Session history and basic dashboard
- Responsive UI with agent-specific theming

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
