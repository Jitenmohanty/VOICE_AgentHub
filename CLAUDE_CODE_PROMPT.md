# 🎯 Project: AgentHub — Multi-Agent Voice AI Platform

## OVERVIEW

Build a full-stack multi-agent voice AI platform called **"AgentHub"** where users log in, select a business domain (Hotel, Medical, Developer Interview, Restaurant, etc.), and get a specialized real-time voice AI agent. The platform uses **Google Gemini 3.1 Flash Live API** for real-time voice conversations.

---

## TECH STACK

| Layer            | Technology                                                  |
| ---------------- | ----------------------------------------------------------- |
| **Framework**    | Next.js 14+ (App Router)                                   |
| **Language**     | TypeScript (strict mode)                                    |
| **Styling**      | Tailwind CSS + Framer Motion (animations)                   |
| **Auth**         | NextAuth.js v5 (Google + GitHub + Credentials providers)    |
| **Database**     | PostgreSQL via Prisma ORM                                   |
| **State Mgmt**   | Zustand                                                     |
| **Voice API**    | Google Gemini 3.1 Flash Live API (`@google/genai` SDK)      |
| **Real-time**    | WebSocket (for Gemini Live API streaming)                   |
| **UI Components**| shadcn/ui + Radix primitives                                |
| **Icons**        | Lucide React                                                |
| **Deployment**   | Vercel (frontend) + Neon/Supabase (PostgreSQL)              |
| **Testing**      | Vitest + React Testing Library                              |
| **Linting**      | ESLint + Prettier                                           |

---

## PROJECT STRUCTURE

```
agenthub/
├── prisma/
│   └── schema.prisma              # Database schema
├── public/
│   └── assets/                    # Static assets, agent avatars
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Login page
│   │   │   └── register/page.tsx  # Register page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx # Main dashboard - agent selection
│   │   │   └── layout.tsx         # Dashboard layout with sidebar
│   │   ├── (agents)/
│   │   │   ├── hotel/page.tsx     # Hotel agent voice UI
│   │   │   ├── medical/page.tsx   # Medical agent voice UI
│   │   │   ├── interview/page.tsx # Dev interview agent voice UI
│   │   │   ├── restaurant/page.tsx# Restaurant agent voice UI
│   │   │   ├── legal/page.tsx     # Legal advisor agent voice UI
│   │   │   └── layout.tsx         # Agent session layout
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── gemini/
│   │       │   └── session/route.ts   # Create Gemini Live session
│   │       └── sessions/
│   │           └── route.ts           # CRUD for user sessions/history
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── AgentShowcase.tsx
│   │   │   └── CTA.tsx
│   │   ├── dashboard/
│   │   │   ├── AgentGrid.tsx      # Grid of available agents
│   │   │   ├── AgentCard.tsx      # Individual agent card
│   │   │   ├── SessionHistory.tsx # Past conversations
│   │   │   └── UserStats.tsx      # Usage statistics
│   │   ├── agent/
│   │   │   ├── VoiceInterface.tsx # Main voice conversation UI
│   │   │   ├── AudioVisualizer.tsx# Real-time audio waveform
│   │   │   ├── AgentAvatar.tsx    # Animated agent avatar
│   │   │   ├── TranscriptPanel.tsx# Live transcript
│   │   │   ├── ControlBar.tsx     # Mic, end call, settings
│   │   │   └── ConfigPanel.tsx    # Agent-specific config (e.g., tech stack selector)
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       └── LoadingStates.tsx
│   ├── lib/
│   │   ├── gemini/
│   │   │   ├── client.ts          # Gemini API client setup
│   │   │   ├── live-session.ts    # WebSocket session manager
│   │   │   └── audio-utils.ts     # Audio capture/playback utilities
│   │   ├── agents/
│   │   │   ├── index.ts           # Agent registry
│   │   │   ├── hotel-agent.ts     # Hotel agent system prompt + tools
│   │   │   ├── medical-agent.ts   # Medical agent system prompt + tools
│   │   │   ├── interview-agent.ts # Interview agent system prompt + tools
│   │   │   ├── restaurant-agent.ts# Restaurant agent system prompt + tools
│   │   │   └── legal-agent.ts     # Legal agent system prompt + tools
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── db.ts                  # Prisma client singleton
│   │   └── utils.ts               # Shared utilities
│   ├── hooks/
│   │   ├── useGeminiLive.ts       # Core hook for Gemini Live API
│   │   ├── useAudioStream.ts      # Microphone + speaker management
│   │   ├── useAgent.ts            # Agent state management
│   │   └── useTranscript.ts       # Real-time transcript hook
│   ├── stores/
│   │   ├── agent-store.ts         # Zustand store for active agent
│   │   └── session-store.ts       # Zustand store for session state
│   └── types/
│       ├── agent.ts               # Agent type definitions
│       ├── session.ts             # Session type definitions
│       └── gemini.ts              # Gemini API type definitions
├── .env.local                     # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## EXECUTION PLAN — BUILD STEP BY STEP

### PHASE 1: Project Setup & Configuration

```
Step 1.1: Initialize the project
- Run: npx create-next-app@latest agenthub --typescript --tailwind --eslint --app --src-dir
- cd agenthub
- Install dependencies:
  npm install @google/genai prisma @prisma/client next-auth@beta zustand framer-motion lucide-react @radix-ui/react-dialog @radix-ui/react-dropdown-menu class-variance-authority clsx tailwind-merge
- Install dev deps:
  npm install -D vitest @testing-library/react prisma

Step 1.2: Configure TypeScript strict mode
- tsconfig.json: set "strict": true, "noUncheckedIndexedAccess": true

Step 1.3: Setup Tailwind with custom theme
- Add custom colors, fonts (use Google Font: "Outfit" for headings, "IBM Plex Sans" for body)
- Add animation utilities for voice UI

Step 1.4: Setup Prisma
- npx prisma init
- Configure schema (see DATABASE SCHEMA section)

Step 1.5: Setup environment variables (.env.local)
GOOGLE_GEMINI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### PHASE 2: Database Schema & Auth

```
Step 2.1: Define Prisma schema

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For credentials provider
  accounts      Account[]
  sessions      Session[]
  agentSessions AgentSession[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  // Standard NextAuth account model
}

model Session {
  // Standard NextAuth session model
}

model AgentSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  agentType   String   // "hotel" | "medical" | "interview" | "restaurant" | "legal"
  config      Json     // Agent-specific config (e.g., { techStack: ["React", "Node.js"] })
  transcript  Json?    // Full conversation transcript
  duration    Int?     // Session duration in seconds
  rating      Int?     // User rating 1-5
  status      String   @default("active") // "active" | "completed" | "cancelled"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

Step 2.2: Run migration
- npx prisma migrate dev --name init

Step 2.3: Setup NextAuth v5
- Create src/lib/auth.ts with Google + GitHub + Credentials providers
- Create API route src/app/api/auth/[...nextauth]/route.ts
- Create middleware.ts for protected routes
```

### PHASE 3: Landing Page

```
Step 3.1: Build landing page (src/app/page.tsx)

Design Requirements:
- THEME: Dark mode with glowing accent colors (cyan/electric blue primary, warm amber secondary)
- Hero section: Large headline "Your Business. Your AI Agent. Your Voice."
  - Subtitle: "Choose your industry. Get a specialized voice AI agent powered by Gemini."
  - Animated floating agent avatars in background
  - CTA buttons: "Get Started" → /register, "See Agents" → scroll to showcase
- Agent Showcase section:
  - Horizontal scrolling cards showing each agent type
  - Each card: icon, name, description, example conversation snippet
  - Cards have glassmorphism effect with colored borders
  - Agents: Hotel Concierge, Medical Assistant, Interview Coach, Restaurant Host, Legal Advisor
- Features section:
  - "90+ Languages" | "Real-time Voice" | "Domain Expert" | "Noise Filtering"
  - Animated counters/icons
- How It Works:
  - 3 steps: Sign Up → Pick Agent → Start Talking
  - Illustrated with icons and connecting lines
- CTA section: "Ready to meet your AI agent?" with sign up button

Step 3.2: Add Framer Motion animations
- Staggered fade-in for sections on scroll
- Floating animation for agent avatars
- Smooth hover effects on cards
```

### PHASE 4: Auth Pages

```
Step 4.1: Login page (/login)
- Clean form with email/password
- OAuth buttons (Google, GitHub) with branded colors
- Link to register
- Animated background matching landing page theme

Step 4.2: Register page (/register)
- Name, email, password fields
- OAuth options
- Link to login
- After registration → redirect to /dashboard
```

### PHASE 5: Dashboard — Agent Selection

```
Step 5.1: Dashboard layout
- Left sidebar: Navigation (Dashboard, History, Settings, Logout)
- Top bar: User avatar, notification bell, quick stats
- Main area: Agent grid

Step 5.2: Agent Selection Grid (AgentGrid.tsx)
- 2x3 grid of agent cards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Each AgentCard.tsx contains:
  - Agent icon/avatar (use Lucide icons: Hotel, Stethoscope, Code, UtensilsCrossed, Scale)
  - Agent name & tagline
  - "Available" status badge (green dot)
  - Supported languages count
  - "Start Conversation" button
  - Hover: card lifts with shadow, accent color glow

Step 5.3: Agent Cards Data (define in src/lib/agents/index.ts):

AGENTS = [
  {
    id: "hotel",
    name: "Hotel Concierge",
    tagline: "Your 24/7 front desk assistant",
    description: "Handles bookings, room service, guest inquiries, complaints, and concierge services in 90+ languages.",
    icon: "Hotel",
    accentColor: "#F59E0B", // amber
    capabilities: ["Booking Management", "Room Service", "Guest FAQ", "Complaint Resolution"],
    configFields: [
      { id: "hotelName", label: "Hotel Name", type: "text" },
      { id: "hotelType", label: "Hotel Type", type: "select", options: ["Luxury", "Business", "Budget", "Resort", "Boutique"] }
    ]
  },
  {
    id: "medical",
    name: "Medical Assistant",
    tagline: "Compassionate patient support",
    description: "Helps with appointment scheduling, symptom pre-screening, medication reminders, and patient FAQ.",
    icon: "Stethoscope",
    accentColor: "#10B981", // green
    capabilities: ["Appointment Booking", "Symptom Pre-Screen", "Medication Info", "Insurance FAQ"],
    configFields: [
      { id: "clinicName", label: "Clinic/Hospital Name", type: "text" },
      { id: "specialty", label: "Specialty", type: "select", options: ["General", "Dental", "Cardiology", "Pediatrics", "Dermatology"] }
    ]
  },
  {
    id: "interview",
    name: "Interview Coach",
    tagline: "Ace your next tech interview",
    description: "Conducts mock interviews based on your tech stack. Asks questions, evaluates answers, gives real-time feedback on communication.",
    icon: "Code",
    accentColor: "#6366F1", // indigo
    capabilities: ["Mock Interviews", "Code Review", "System Design", "Behavioral Prep"],
    configFields: [
      { id: "techStack", label: "Tech Stack", type: "multi-select", options: ["React", "Next.js", "Node.js", "TypeScript", "Python", "Java", "Go", "Rust", "AWS", "Docker", "Kubernetes", "System Design", "DSA"] },
      { id: "level", label: "Experience Level", type: "select", options: ["Junior", "Mid", "Senior", "Staff", "Principal"] },
      { id: "company", label: "Target Company (optional)", type: "text" }
    ]
  },
  {
    id: "restaurant",
    name: "Restaurant Host",
    tagline: "Smart ordering & reservations",
    description: "Takes voice orders, handles customizations, manages reservations, and answers menu questions.",
    icon: "UtensilsCrossed",
    accentColor: "#EF4444", // red
    capabilities: ["Voice Ordering", "Menu Recommendations", "Reservation Management", "Allergy Info"],
    configFields: [
      { id: "restaurantName", label: "Restaurant Name", type: "text" },
      { id: "cuisineType", label: "Cuisine", type: "select", options: ["Italian", "Indian", "Japanese", "Mexican", "American", "Chinese", "Mediterranean"] }
    ]
  },
  {
    id: "legal",
    name: "Legal Advisor",
    tagline: "Preliminary legal guidance",
    description: "Provides general legal information, explains legal terms, helps draft basic documents, and guides on procedures.",
    icon: "Scale",
    accentColor: "#8B5CF6", // violet
    capabilities: ["Legal FAQ", "Document Drafting", "Term Explanations", "Procedure Guidance"],
    configFields: [
      { id: "jurisdiction", label: "Jurisdiction", type: "text" },
      { id: "legalArea", label: "Legal Area", type: "select", options: ["Corporate", "Employment", "Real Estate", "Intellectual Property", "Family", "Criminal"] }
    ]
  }
]

Step 5.4: Agent Configuration Modal
- When user clicks "Start Conversation" on a card, show a modal
- Modal displays the agent's configFields dynamically
- For interview agent: show multi-select chips for tech stacks
- "Start Session" button → navigates to /agents/[agentType] with config in URL params or Zustand store
```

### PHASE 6: Voice Agent Interface (CORE FEATURE)

```
Step 6.1: Build the Voice Interface page (src/app/(agents)/[agentType]/page.tsx)

Layout (full-screen immersive experience):
┌─────────────────────────────────────────────────┐
│  ← Back to Dashboard          Agent: Hotel 🟢   │
├─────────────────────────────────────────────────┤
│                                                 │
│              ┌──────────────┐                   │
│              │              │                   │
│              │  Agent Avatar│                   │
│              │  (Animated)  │                   │
│              │              │                   │
│              └──────────────┘                   │
│                                                 │
│         "How can I help you today?"             │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Live Transcript                          │  │
│  │  Agent: Welcome to Grand Hotel, how...    │  │
│  │  You: I'd like to book a room for...      │  │
│  │  Agent: Of course! For how many nights?   │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│     ┌─────────────────────────────────────┐     │
│     │  ○○○○ Audio Visualizer Waveform ○○○○│     │
│     └─────────────────────────────────────┘     │
│                                                 │
│     [🔇 Mute]  [🔴 End Call]  [⚙️ Settings]    │
└─────────────────────────────────────────────────┘

Step 6.2: Agent Avatar Component (AgentAvatar.tsx)
- Circular avatar with agent icon
- Pulsing ring animation when agent is speaking
- Color matches agent's accentColor
- States: idle, listening, thinking, speaking

Step 6.3: Audio Visualizer (AudioVisualizer.tsx)
- Canvas-based waveform visualization
- Reacts to both user microphone input and agent audio output
- Smooth bar animation with agent accent color
- Use Web Audio API's AnalyserNode for frequency data

Step 6.4: Transcript Panel (TranscriptPanel.tsx)
- Scrollable transcript showing conversation
- Messages labeled "You:" and "Agent:"
- Auto-scrolls to latest message
- Timestamps on each message
- Typing indicator when agent is processing

Step 6.5: Control Bar (ControlBar.tsx)
- Mute/Unmute microphone toggle
- End Call button (red, prominent)
- Settings gear (opens config panel)
- Session timer showing elapsed time
```

### PHASE 7: Gemini Live API Integration

```
Step 7.1: Gemini Client Setup (src/lib/gemini/client.ts)

import { GoogleGenAI } from "@google/genai";

export const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

Step 7.2: Live Session Manager (src/lib/gemini/live-session.ts)

This is the CORE module. It manages the WebSocket connection to Gemini Live API.

Key responsibilities:
- Establish WebSocket connection using Gemini SDK
- Stream user audio (from microphone) to Gemini
- Receive and play agent audio responses
- Handle tool calls (function calling)
- Manage session lifecycle (start, pause, resume, end)
- Handle interruptions (user speaking while agent is responding)

Implementation pattern:
export class GeminiLiveSession {
  private session: any;
  private audioContext: AudioContext;
  
  async connect(agentType: string, config: AgentConfig) {
    const agentPrompt = getAgentSystemPrompt(agentType, config);
    
    this.session = await genAI.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: ["AUDIO"],
        systemInstruction: agentPrompt,
        tools: getAgentTools(agentType),
      }
    });
  }
  
  async sendAudio(audioData: ArrayBuffer) { ... }
  onAgentAudio(callback: (audio: ArrayBuffer) => void) { ... }
  onTranscript(callback: (text: string, speaker: string) => void) { ... }
  async disconnect() { ... }
}

Step 7.3: Audio Utilities (src/lib/gemini/audio-utils.ts)
- getUserMicrophone(): Request and capture microphone stream
- createAudioPlayer(): Play agent audio responses using Web Audio API
- encodeAudioForGemini(): Convert raw audio to format Gemini expects (PCM 16-bit, 16kHz mono)
- decodeGeminiAudio(): Convert Gemini audio response to playable format

Step 7.4: useGeminiLive Hook (src/hooks/useGeminiLive.ts)
This is the main React hook that components use:

function useGeminiLive(agentType: string, config: AgentConfig) {
  return {
    // State
    isConnected: boolean,
    isAgentSpeaking: boolean,
    isUserSpeaking: boolean,
    transcript: TranscriptMessage[],
    error: string | null,
    
    // Actions
    connect: () => Promise<void>,
    disconnect: () => Promise<void>,
    toggleMute: () => void,
    
    // Audio data for visualizer
    analyserNode: AnalyserNode | null,
  }
}

Step 7.5: useAudioStream Hook (src/hooks/useAudioStream.ts)
- Manages MediaStream from getUserMedia
- Handles audio encoding/decoding
- Provides AnalyserNode for visualization
- Handles mute/unmute
```

### PHASE 8: Agent System Prompts & Tools

```
Step 8.1: Each agent file (src/lib/agents/[agent]-agent.ts) exports:

1. getSystemPrompt(config): Returns the system instruction string
2. getTools(): Returns function declarations for tool use
3. handleToolCall(name, args): Handles tool execution

Step 8.2: Hotel Agent (hotel-agent.ts)

System Prompt:
"You are the AI concierge for {hotelName}, a {hotelType} hotel. You speak in a warm, 
professional tone. You help guests with:
- Room bookings and availability checks
- Room service orders
- Local recommendations (restaurants, attractions, transport)
- Handling complaints with empathy
- Providing hotel information (amenities, check-in/out times, policies)
Always greet guests warmly. If you don't know something specific, offer to 
connect them with human staff. Never make up information about the hotel."

Tools: checkAvailability, placeRoomServiceOrder, getLocalRecommendations, 
       createMaintenanceRequest, getHotelInfo

Step 8.3: Medical Agent (medical-agent.ts)

System Prompt:
"You are a medical reception assistant for {clinicName} ({specialty}). You help with:
- Scheduling and managing appointments
- Basic symptom pre-screening (NOT diagnosis)
- Medication reminder information
- Insurance and billing FAQs
- Clinic information
IMPORTANT: Always clarify you are an AI assistant, not a doctor. For any emergency, 
immediately direct the patient to call emergency services. Never diagnose conditions."

Tools: checkDoctorAvailability, scheduleAppointment, getClinicInfo, 
       getInsuranceFAQ, flagEmergency

Step 8.4: Interview Coach Agent (interview-agent.ts)

System Prompt:
"You are a senior tech interview coach. The candidate's profile:
- Tech Stack: {techStack.join(', ')}
- Level: {level}
- Target: {company || 'general'}

Your role:
1. Conduct mock interviews covering: coding concepts, system design, behavioral questions
2. Ask one question at a time, wait for the answer
3. After each answer: rate it (1-10), explain what was good, what to improve
4. Adjust difficulty based on performance
5. Track score across the session
6. Give communication feedback: filler words, confidence, structure (STAR method)
7. For coding questions, discuss approaches and trade-offs verbally
Be encouraging but honest. Use a conversational, professional tone."

Tools: getQuestionBank, scoreAnswer, getFollowUpQuestion, generateSessionReport

Step 8.5: Restaurant Agent (restaurant-agent.ts)

System Prompt:
"You are the AI host for {restaurantName}, a {cuisineType} restaurant. You handle:
- Taking food orders with customizations
- Menu recommendations based on preferences/allergies
- Table reservations
- Wait time estimates
- Answering menu questions (ingredients, preparation, allergens)
Be friendly, know the menu well. Repeat orders back for confirmation.
Handle dietary restrictions carefully."

Tools: getMenu, placeOrder, checkTableAvailability, makeReservation, getAllergenInfo

Step 8.6: Legal Agent (legal-agent.ts)

System Prompt:
"You are a legal information assistant specializing in {legalArea} law in {jurisdiction}. 
You provide:
- General legal information and term explanations
- Procedural guidance (how to file, deadlines, requirements)
- Document drafting assistance (basic templates)
- FAQ on common legal questions
CRITICAL DISCLAIMER: Always state you provide general information only, 
not legal advice. Recommend consulting a licensed attorney for specific cases.
Never guarantee outcomes."

Tools: getLegalTermDefinition, getFilingProcedure, getDraftTemplate, 
       getFrequentlyAskedQuestions
```

### PHASE 9: Session History & Analytics

```
Step 9.1: Session History Page (/dashboard/history)
- List of past agent sessions
- Filterable by agent type, date range, rating
- Each entry shows: agent name, date, duration, rating, transcript preview
- Click to expand full transcript

Step 9.2: API Routes for sessions
- POST /api/sessions - Create new session record
- GET /api/sessions - Get user's session history
- PATCH /api/sessions/[id] - Update session (add transcript, rating, end time)
- DELETE /api/sessions/[id] - Delete a session

Step 9.3: Session Rating
- After ending a call, show a rating modal (1-5 stars)
- Optional feedback text
- Saved to AgentSession model
```

### PHASE 10: Polish & Production Readiness

```
Step 10.1: Error Handling
- Graceful handling of: microphone permission denied, Gemini API errors, 
  network disconnections, session timeouts
- Toast notifications for errors using sonner
- Reconnection logic for dropped WebSocket connections

Step 10.2: Loading States
- Skeleton loaders for dashboard
- Connection animation when establishing Gemini session
- "Agent is thinking..." indicator

Step 10.3: Responsive Design
- Mobile: single column, bottom control bar, collapsible transcript
- Tablet: side-by-side transcript and avatar
- Desktop: full immersive layout

Step 10.4: Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader announcements for agent responses
- High contrast mode support

Step 10.5: SEO & Meta
- Open Graph tags for sharing
- Dynamic page titles per agent
- Proper meta descriptions
```

---

## AGENT SYSTEM PROMPT TEMPLATES

### The system prompts should follow this structure:

```typescript
export function getSystemPrompt(agentId: string, config: Record<string, any>): string {
  const baseInstructions = `
    You are an AI voice agent on the AgentHub platform.
    Core behaviors:
    - Respond conversationally and naturally
    - Keep responses concise (2-3 sentences for voice)
    - Ask clarifying questions when needed
    - Be helpful, professional, and empathetic
    - If you cannot help, explain why and suggest alternatives
  `;
  
  const agentSpecificPrompt = agentPrompts[agentId](config);
  
  return `${baseInstructions}\n\n${agentSpecificPrompt}`;
}
```

---

## DESIGN SYSTEM

### Colors (CSS Variables):
```css
:root {
  --bg-primary: #0A0A0F;
  --bg-secondary: #12121A;
  --bg-card: #1A1A2E;
  --text-primary: #F0F0F5;
  --text-secondary: #8888AA;
  --accent-cyan: #00D4FF;
  --accent-amber: #FFB800;
  --border: #2A2A3E;
  --glass: rgba(255, 255, 255, 0.05);
}
```

### Typography:
- Headings: "Outfit" (Google Font) — geometric, modern, bold
- Body: "IBM Plex Sans" — clean, technical, readable
- Monospace: "JetBrains Mono" — for code/tech elements

### Design Tokens:
- Border radius: 12px (cards), 8px (buttons), 50% (avatars)
- Glassmorphism: backdrop-blur-xl + semi-transparent bg
- Shadows: colored glow matching agent accent
- Transitions: all 0.2s ease

---

## KEY IMPLEMENTATION NOTES

1. **Gemini Live API uses WebSocket** — the `@google/genai` SDK handles this, but ensure you're using the `live.connect()` method, NOT the regular `generateContent()`.

2. **Audio format** — Gemini Live expects PCM 16-bit, 16kHz, mono. Use Web Audio API's AudioWorklet for real-time processing.

3. **The model ID is `gemini-3.1-flash-live-preview`** — this is the specific model for real-time voice.

4. **Tool use in Live API** — When Gemini calls a tool, you receive a `toolCall` event. Execute the function and send results back via `session.sendToolResponse()`.

5. **Interruption handling** — Gemini Live supports barge-in (user interrupting the agent). The SDK handles this, but your UI should reflect the state change.

6. **Session management** — Gemini Live sessions have a timeout. Implement heartbeat/keep-alive and reconnection logic.

7. **API Key Security** — NEVER expose the Gemini API key to the client. All Gemini communication should go through your Next.js API routes or server actions.

---

## ENVIRONMENT VARIABLES NEEDED

```env
# Gemini
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# NextAuth
NEXTAUTH_SECRET=generate_a_random_secret
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agenthub

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## COMMANDS TO RUN IN ORDER

```bash
# 1. Create project
npx create-next-app@latest agenthub --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies
cd agenthub
npm install @google/genai prisma @prisma/client next-auth@beta zustand framer-motion lucide-react sonner class-variance-authority clsx tailwind-merge

# 3. Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input label select badge avatar dropdown-menu sheet tabs toast

# 4. Setup Prisma
npx prisma init
# Edit schema.prisma, then:
npx prisma migrate dev --name init
npx prisma generate

# 5. Start dev server
npm run dev
```

---

## SUCCESS CRITERIA

When complete, the app should:
1. ✅ Show a polished landing page explaining the platform
2. ✅ Allow users to register/login (Google, GitHub, or email)
3. ✅ Display a dashboard with 5 agent cards
4. ✅ Let users configure agent settings before starting
5. ✅ Establish a real-time voice session with Gemini 3.1 Flash Live
6. ✅ Show animated agent avatar and audio visualizer during conversation
7. ✅ Display live transcript of the conversation
8. ✅ Allow muting, ending calls, and rating sessions
9. ✅ Save session history to database
10. ✅ Be fully responsive and accessible
11. ✅ Handle errors gracefully with proper user feedback

---

**BUILD THIS STEP BY STEP. COMPLETE EACH PHASE BEFORE MOVING TO THE NEXT. TEST EACH COMPONENT AS YOU BUILD IT.**
