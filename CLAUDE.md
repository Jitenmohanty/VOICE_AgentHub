@AGENTS.md

# AgentHub

Multi-tenant voice AI SaaS platform. Business owners create industry-specific AI voice agents; end customers talk to them via shareable public links — no login required.

---

## Commands

```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint

npx prisma db push   # Push schema changes to Neon (no migration files needed)
npx prisma studio    # Open Prisma Studio GUI
npx prisma generate  # Regenerate Prisma client after schema changes
```

---

## Tech Stack

| Layer | Tech | Entry Point |
|-------|------|-------------|
| Framework | Next.js 16 App Router (TypeScript strict) | `next.config.ts` |
| Auth | NextAuth v5 — JWT strategy, Google + GitHub OAuth + Credentials | `src/lib/auth.ts` |
| Database | PostgreSQL on Neon (serverless), Prisma 7.6 + `@prisma/adapter-neon` | `src/lib/db.ts` |
| Vector Search | pgvector (768-dim cosine similarity) | `src/lib/embeddings.ts`, `src/lib/rag.ts` |
| Voice AI | Gemini 3.1 Flash Live API (`@google/genai`) — real-time WebSocket audio | `src/lib/gemini/` |
| Post-Call AI | Claude Sonnet 4 (`@anthropic-ai/sdk`) | `src/lib/claude.ts` |
| State | Zustand | `src/stores/` |
| UI | Tailwind CSS 4 + shadcn/ui + Radix primitives | `src/components/ui/` |
| Observability | LangSmith tracing | `src/lib/langsmith.ts` |

---

## File Structure

```
src/
├── app/
│   ├── (agents)/         Voice agent pages (public, no auth)
│   ├── (auth)/           Login / Register
│   ├── (business)/       Protected business dashboard (onboarding, config, sessions)
│   ├── (dashboard)/      Business overview
│   ├── a/[slug]/         Public agent page — no auth required ← customer entry point
│   └── api/
│       ├── auth/         NextAuth handlers + /register
│       ├── business/     CRUD: agent config, knowledge items, business data
│       ├── gemini/       Ephemeral token endpoint for Gemini Live WebSocket
│       ├── internal/     post-call analysis (Claude), embeddings — server-to-server only
│       ├── public/       Public read endpoints (no auth)
│       └── sessions/     Session save endpoint (anonymous callers)
├── lib/
│   ├── agents/           Per-template agent definitions (hotel, medical, restaurant, interview, legal)
│   ├── gemini/           Live session, audio utils, agent prompt builder
│   ├── auth.ts           NextAuth config
│   ├── claude.ts         Claude API client for post-call analysis
│   ├── db.ts             Prisma client (Neon HTTP adapter — import this, not @prisma/client)
│   ├── embeddings.ts     Gemini text-embedding-004 (768 dims)
│   ├── rag.ts            pgvector cosine similarity search
│   ├── templates.ts      Industry template definitions + configFields ← source of truth
│   └── post-call.ts      Fire-and-forget post-call analysis trigger
├── components/
│   ├── agent/            Voice interface: VoiceInterface, TranscriptPanel, ControlBar, AudioVisualizer
│   ├── business/         Dashboard: MenuBuilder, DoctorRoster
│   ├── dashboard/        AgentCard, SessionHistory, modals
│   └── ui/               shadcn/ui primitives
├── hooks/
│   ├── useGeminiLive.ts  Main voice call hook
│   ├── useAudioStream.ts Mic capture via AudioWorklet
│   └── useTranscript.ts  Transcript state
└── stores/
    ├── agent-store.ts    Agent config state (Zustand)
    └── session-store.ts  Call session state (Zustand)
```

---

## Database Schema

```
User
 └── Business (name, slug unique, industry)
      └── Agent (templateType, name, config JSON, systemPrompt, greeting, personality, rules)
           ├── KnowledgeItem (title, content, category, embedding vector(768))
           ├── BusinessData (dataType, data JSON)  ← rooms, menu, doctors, etc.
           └── AgentSession (transcript JSON, duration, rating, AI analysis fields)
```

**Key facts:**
- `Agent.config` is a JSON column holding template-specific fields (e.g. `hotelName`, `cuisineType`)
- `KnowledgeItem.embedding` is `Unsupported("vector(768)")` — raw SQL for vector operations in `rag.ts`
- `AgentSession` has **no User FK** — callers are anonymous
- Prisma client uses `@prisma/adapter-neon` (HTTP adapter) — always import from `@/lib/db`

---

## Industry Templates

Defined in `src/lib/templates.ts` (configFields, defaultGreeting, defaultPersonality, etc.).
Agent logic in `src/lib/agents/<template>-agent.ts`.

| Template ID | File | Default Data Types |
|-------------|------|--------------------|
| `hotel` | `hotel-agent.ts` | rooms, services, amenities, policies |
| `medical` | `medical-agent.ts` | doctors, services, hours, insurance |
| `restaurant` | `restaurant-agent.ts` | menu_items, hours, specials |
| `interview` | `interview-agent.ts` | question_bank, evaluation_criteria |
| `legal` | `legal-agent.ts` | practice_areas, attorneys, fee_structure |

To add a new template: add to `TEMPLATES` array in `templates.ts`, create `<name>-agent.ts` in `src/lib/agents/`, add public pre-call component to `src/components/public/`.

---

## Voice Pipeline

```
Browser mic → AudioWorklet (16kHz PCM16) → base64 → HTTP proxy → Gemini Live WebSocket
                                                                         ↓
Browser speaker ← Web Audio API (24kHz) ← PCM16 base64 ←───────────────┘
```

- **Worklet file**: `public/audio-capture-worklet.js` — served as static asset, do NOT import it as a module
- **Hook**: `src/hooks/useGeminiLive.ts` — connect/disconnect, send audio, handle transcript
- **Session**: `src/lib/gemini/live-session.ts` — WebSocket lifecycle, event handlers
- **Audio format in**: 16kHz PCM16 mono; **format out**: 24kHz PCM16

## Post-Call Analysis (Claude)

1. Session ends → `triggerPostCallAnalysis(sessionId)` in `src/lib/post-call.ts`
2. Fires POST to `/api/internal/post-call` (fire-and-forget)
3. Claude analyzes transcript → writes to `AgentSession`: `summary`, `sentiment`, `sentimentScore`, `actionItems`, `topics`, `escalated`
4. Deduplication guard: skips if already analyzed

---

## API Route Patterns

```typescript
// Protected business route (requires auth)
import { auth } from "@/lib/auth";
const session = await auth();
if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Public session endpoint — no auth
// /api/sessions/ accepts anonymous callers

// Internal route — no auth but server-to-server only
// /api/internal/post-call, /api/internal/embeddings
```

---

## Key Conventions

- **Imports**: Always use `@/` alias (maps to `src/`); never use relative paths across feature dirs
- **Prisma**: Import `prisma` from `@/lib/db` — never from `@prisma/client` directly
- **Auth in server**: `auth()` from `@/lib/auth`; in client components: `useSession()` from `next-auth/react`
- **Server vs Client**: Components are Server by default; add `"use client"` only when needed (hooks, events, browser APIs)
- **Template config**: Validate against `TEMPLATES` array in `templates.ts` — it's the single source of truth for configFields
- **New shadcn components**: Use `npx shadcn@latest add <component>` — components land in `src/components/ui/`

---

## Required Environment Variables

```
# Database
DATABASE_URL=               # Neon PostgreSQL connection string

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=               # http://localhost:3000 in dev

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI
GEMINI_API_KEY=             # Used for voice + embeddings
ANTHROPIC_API_KEY=          # Used for post-call Claude analysis

# Observability (optional)
LANGSMITH_API_KEY=
LANGSMITH_TRACING_V2=true
```

---

## Gotchas

- **Next.js 16 breaking changes** — APIs differ from training data. Before any Next.js work, check `node_modules/next/dist/docs/`.
- **Neon HTTP adapter** — `prisma.$transaction()` has limitations; prefer individual sequential queries.
- **pgvector raw SQL** — Vector columns can't use standard Prisma query builders; see `src/lib/rag.ts` for the pattern.
- **AudioWorklet** — Must be at `public/audio-capture-worklet.js` (static file served at `/audio-capture-worklet.js`). Never import as an ES module.
- **Session save on browser close** — Uses `beforeunload` + `keepalive: true` fetch. Do not introduce `async` logic here.
- **LangSmith** — Wrap Claude/embedding calls with `wrapTraced()` from `src/lib/langsmith.ts` for observability.

