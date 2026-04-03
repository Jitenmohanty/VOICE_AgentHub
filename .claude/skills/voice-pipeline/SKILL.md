---
name: voice-pipeline
description: "Use when working on the real-time voice pipeline in AgentHub: Gemini Live API WebSocket, AudioWorklet, audio capture/playback, transcript handling, system prompt building, or session lifecycle."
---

# Voice Pipeline

**When**: Modifying real-time voice behavior, audio processing, session events, or the dynamic system prompt.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useGeminiLive.ts` | Main React hook — connect/disconnect, send audio, transcript |
| `src/hooks/useAudioStream.ts` | Mic capture via AudioWorklet (16kHz PCM16) |
| `src/lib/gemini/live-session.ts` | WebSocket lifecycle, `sendAudio()`, event handlers |
| `src/lib/gemini/audio-utils.ts` | PCM16 encode/decode helpers |
| `src/lib/gemini/agent-prompts.ts` | Builds dynamic system prompt (config + RAG + business data) |
| `src/lib/gemini/client.ts` | Gemini API client setup |
| `public/audio-capture-worklet.js` | AudioWorklet processor — static file, never import as ES module |

---

## Audio Format Requirements

| Direction | Sample Rate | Format | Encoding |
|-----------|------------|--------|---------|
| Browser → Gemini | **16kHz** | PCM16, mono | base64 |
| Gemini → Browser | **24kHz** | PCM16 | base64, decoded via Web Audio API |

**Do not change sample rates** — Gemini Live API requires exactly 16kHz input.

---

## Modifying the System Prompt

Edit `src/lib/gemini/agent-prompts.ts` → `buildAgentPrompt()`:

```typescript
export async function buildAgentPrompt(agentId: string, config: AgentConfig): Promise<string> {
  // 1. Base template prompt
  const basePrompt = getTemplatePrompt(config.templateType, config);

  // 2. RAG context from pgvector
  const ragContext = await getRagContext(agentId);

  // 3. Structured business data (rooms, menu, doctors, etc.)
  const businessData = await getBusinessData(agentId);

  return `${basePrompt}\n\n## Knowledge\n${ragContext}\n\n## Business Data\n${businessData}`;
}
```

Each template delegates to its own file in `src/lib/agents/`.

---

## Adding a Gemini Session Event Handler

In `src/lib/gemini/live-session.ts` inside `setupEventHandlers()`:

```typescript
session.on("toolCall", (toolCall) => {
  this.handleToolCall(toolCall);
});

session.on("interrupted", () => {
  // Handle barge-in / user interruption
  this.stopCurrentAudio();
});
```

---

## AudioWorklet Constraint

- File lives at `public/audio-capture-worklet.js`
- Served as a static asset at `/audio-capture-worklet.js`
- Loaded via `audioContext.audioWorklet.addModule('/audio-capture-worklet.js')`
- **Never import it as an ES module** — it won't work

---

## Session Save on Browser Close

```typescript
// Uses keepalive — do NOT add async logic here
window.addEventListener("beforeunload", () => {
  fetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ transcript, duration }),
    keepalive: true,          // critical — keeps request alive after page close
  });
});
```

---

## Transcript State

Transcript messages flow through `src/stores/session-store.ts`:

```typescript
// Adding a new message
addMessage({ id, role: "user" | "agent", text, timestamp });

// Updating a partial (streaming) message
updateMessage(id, { text: updatedText });
```
