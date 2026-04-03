---
name: add-template
description: "Use when adding a new industry template or agent type to AgentHub (e.g. fitness, ecommerce, real-estate). Covers templates.ts, agent file, system prompt, and pre-call component."
---

# Add a New Industry Template

**When**: User wants to add a new agent type (e.g. `fitness`, `ecommerce`).

---

## Steps

### 1. Add to `src/lib/templates.ts`

```typescript
{
  id: "fitness",
  name: "Fitness Coach",
  tagline: "Your AI personal trainer",
  description: "Handles class bookings, workout plans, diet queries, and member FAQ.",
  icon: "Dumbbell",                     // Lucide icon name
  accentColor: "#8B5CF6",
  capabilities: ["Class Booking", "Workout Plans", "Diet FAQ", "Membership Info"],
  configFields: [
    { id: "gymName", label: "Gym Name", type: "text", defaultValue: "FitZone", section: "Basic Info" },
    { id: "gymType", label: "Gym Type", type: "select", options: ["CrossFit", "Yoga", "Pilates", "General", "Boxing"], defaultValue: "General", section: "Basic Info" },
    // time, number, toggle, multi-select, textarea supported
  ],
  defaultGreeting: "Welcome to FitZone! How can I help you today?",
  defaultPersonality: "Energetic, motivating, and supportive.",
  defaultKnowledgeCategories: ["faq", "classes", "pricing", "policy"],
  defaultBusinessDataTypes: ["classes", "trainers", "pricing"],
}
```

### 2. Create `src/lib/agents/fitness-agent.ts`

```typescript
import type { AgentConfig } from "@/types/agent";

export function getFitnessSystemPrompt(config: AgentConfig, businessDataContext?: string): string {
  return `You are an AI fitness assistant for ${config.gymName || "a gym"}.
Gym Type: ${config.gymType || "General Fitness"}

${businessDataContext ? `\n## Available Data\n${businessDataContext}` : ""}

Always be energetic and motivating. Suggest booking classes when relevant.
Never provide medical advice — refer to a doctor for health concerns.`;
}
```

### 3. `src/lib/agents/index.ts`

No change needed — `AGENTS` is derived from `TEMPLATES` automatically.

### 4. Update `src/lib/gemini/agent-prompts.ts`

Route the new template ID to the new system prompt function:

```typescript
import { getFitnessSystemPrompt } from "@/lib/agents/fitness-agent";

// Inside buildAgentPrompt() switch/if:
case "fitness":
  basePrompt = getFitnessSystemPrompt(config, businessDataContext);
  break;
```

### 5. Add pre-call component (optional)

`src/components/public/FitnessPreCall.tsx` — shown to customers before they start the call (template-specific info/disclaimer).

---

## configField Types Reference

| type | Renders as |
|------|-----------|
| `text` | Text input |
| `textarea` | Multi-line text |
| `select` | Dropdown (needs `options: string[]`) |
| `multi-select` | Checkbox group (needs `options: string[]`) |
| `number` | Number input (supports `min`, `max`) |
| `time` | Time picker (HH:MM, 24h) |
| `toggle` | Boolean switch |

## Checklist

- [ ] Entry added to `TEMPLATES` array in `templates.ts`
- [ ] `src/lib/agents/<template>-agent.ts` created with `getXxxSystemPrompt()`
- [ ] `agent-prompts.ts` routes to new function
- [ ] Pre-call component added if needed
- [ ] `npx prisma db push` if new `defaultBusinessDataTypes` require new data
