import {
  GoogleGenAI,
  Session,
  LiveServerMessage,
  Modality,
  StartSensitivity,
  EndSensitivity,
} from "@google/genai";
import type { AgentConfig } from "@/types/agent";
import { getAgentSystemPrompt, getAgentTools, handleAgentToolCall } from "./agent-prompts";
import { pcm16Base64ToFloat32, createAudioContext } from "./audio-utils";

/**
 * Per-agent-type generation tuning. The defaults Gemini Live uses are tuned
 * for chatbots — they're too eager for a back-and-forth voice agent and
 * disastrous for an interview where the candidate needs thinking time.
 */
function tuningForAgent(agentType: string): {
  temperature: number;
  silenceDurationMs: number;
  endSensitivity: EndSensitivity;
} {
  if (agentType === "interview") {
    return {
      // 0.75 balances two competing goals: (a) low enough that the agent
      // doesn't rephrase the same question multiple times within one call,
      // (b) high enough that the *same candidate retaking the interview*
      // doesn't get the same questions session after session. Cross-session
      // variety also relies on the per-session varietySeed + sessionAngles
      // injected by /api/public/agent/[slug]/session/route.ts.
      temperature: 0.75,
      // Wait 2s of silence before declaring end-of-turn. Candidates pause to
      // think mid-answer; the default ~500ms cuts them off and the agent
      // ends up either talking over them or asking the same question again.
      silenceDurationMs: 2000,
      endSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
    };
  }
  // Default for SMB agents (hotel/medical/restaurant/legal). Slightly more
  // patience than the API default but not as long as an interview — a hotel
  // caller asking about rooms shouldn't feel a 2s lag after every utterance.
  return {
    temperature: 0.7,
    silenceDurationMs: 1200,
    endSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
  };
}

export type SessionEventType =
  | "connected"
  | "disconnected"
  | "audio"
  | "transcript"
  | "agent-speaking"
  | "agent-done"
  | "error"
  | "interrupted"
  | "session-expiring"
  | "reconnecting"
  | "reconnected";

// Reconnect budget between healthy stretches — resets on every setupComplete.
const MAX_RECONNECT_ATTEMPTS = 2;
// ~10s of mic audio buffered while the socket is down (worklet chunks are
// short; the cap guards memory, not exact duration).
const MAX_QUEUED_AUDIO_CHUNKS = 160;

export interface SessionEvent {
  type: SessionEventType;
  data?: unknown;
}

type SessionEventCallback = (event: SessionEvent) => void;

/**
 * Manages a real-time voice session with the Gemini Live API.
 * Uses the @google/genai SDK Session class with proper typed callbacks.
 * Audio is sent via sendRealtimeInput({ audio }) per the Live API docs.
 */
export class GeminiLiveSession {
  private client: GoogleGenAI | null = null;
  private session: Session | null = null;
  private audioContext: AudioContext | null = null;
  private listeners: SessionEventCallback[] = [];
  private agentType: string;
  private agentSlug: string;
  private config: AgentConfig;
  private prebuiltPrompt: string | null;
  private prebuiltTools: unknown[] | null;
  private isConnected = false;
  private isDisconnecting = false;
  private isSetupComplete = false;
  private audioChunkQueue: string[] = [];

  // Reconnect state (Item 10). apiKey is retained so an abnormal drop can
  // re-dial with sessionResumption.handle and continue the same conversation.
  private apiKey: string | null = null;
  private isReconnecting = false;
  private reconnectAttempts = 0;

  // Audio playback queue: schedule chunks sequentially to prevent overlap
  private nextPlayTime = 0;
  private activeSourceNodes: Set<AudioBufferSourceNode> = new Set();

  // Interview score tracking (populated by scoreAnswer/advanceRound/endInterview tool calls)
  private interviewScores: { round: number; questionNumber?: number; question?: string; answerSummary?: string; score: number; feedback?: string }[] = [];
  private interviewRounds: { round: number; summary?: string }[] = [];
  private interviewResult: { overallImpression?: string; overallFeedback?: string } | null = null;

  private voiceName: string | null;
  private language: string;
  private sessionId: string | null;
  private updateToken: string | null;
  // Latest session-resumption handle from Gemini. Currently captured-only —
  // a future reconnect feature can replay state by passing this back as
  // sessionResumption.handle on a fresh live.connect().
  private resumptionHandle: string | null = null;

  constructor(
    agentType: string,
    config: AgentConfig,
    options?: {
      systemPrompt?: string;
      tools?: unknown[];
      agentSlug?: string;
      voiceName?: string | null;
      language?: string;
      sessionId?: string;
      updateToken?: string;
    },
  ) {
    this.agentType = agentType;
    this.agentSlug = options?.agentSlug || "";
    this.config = config;
    this.prebuiltPrompt = options?.systemPrompt || null;
    this.prebuiltTools = options?.tools || null;
    this.voiceName = options?.voiceName ?? null;
    this.language = options?.language || "en-US";
    this.sessionId = options?.sessionId ?? null;
    this.updateToken = options?.updateToken ?? null;
  }

  on(callback: SessionEventCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private emit(event: SessionEvent) {
    this.listeners.forEach((l) => l(event));
  }

  async connect(apiKey: string) {
    try {
      this.apiKey = apiKey;
      this.client = new GoogleGenAI({ apiKey });

      try {
        this.audioContext = createAudioContext();
        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }
      } catch (audioErr) {
        throw new Error(
          `Audio playback setup failed: ${audioErr instanceof Error ? audioErr.message : "Browser may not support AudioContext."}`
        );
      }

      await this.openSession(null);
      console.log("[GeminiLive] Session created successfully");
    } catch (error) {
      console.error("[GeminiLive] Connection failed:", error);
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  /**
   * Open (or re-open) the Gemini Live WebSocket. When resumeHandle is set,
   * the server restores the prior conversation state mid-call (Item 10 —
   * the handle is captured continuously in handleMessage).
   */
  private async openSession(resumeHandle: string | null) {
    if (!this.client) throw new Error("Gemini client not initialized");

    const systemInstruction = this.prebuiltPrompt || getAgentSystemPrompt(this.agentType, this.config);
    const tools = (this.prebuiltTools as import("@/types/gemini").GeminiToolDeclaration[]) || getAgentTools(this.agentType);

    console.log("[GeminiLive] Connecting with model: gemini-3.1-flash-live-preview", resumeHandle ? "(resuming)" : "");
    console.log("[GeminiLive] System instruction length:", systemInstruction.length);
    console.log("[GeminiLive] Tools count:", tools.length);

    const tuning = tuningForAgent(this.agentType);
    console.log(
      "[GeminiLive] Tuning:",
      { agentType: this.agentType, temperature: tuning.temperature, silenceDurationMs: tuning.silenceDurationMs },
    );

    const session = await this.client.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: tools.length > 0 ? [{ functionDeclarations: tools as any }] : undefined,
          // Enable transcription for both input (user) and output (agent)
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // Generation tuning per agent type — interviews need patience.
          temperature: tuning.temperature,
          // VAD: declare end-of-turn only after the configured silence
          // window. Default ~500ms cuts off candidates who pause to think,
          // causing the agent to talk over them or re-ask the question.
          realtimeInputConfig: {
            automaticActivityDetection: {
              silenceDurationMs: tuning.silenceDurationMs,
              endOfSpeechSensitivity: tuning.endSensitivity,
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
            },
          },
          // Sliding-window context compression so long calls (8+ minutes
          // close to the Gemini Live 10-min cap) don't lose attention to
          // earlier turns. Server keeps roughly the last 8k tokens of
          // conversation + the system instruction. NOTE: protobuf int64
          // convention — these are STRINGS, not numbers.
          contextWindowCompression: {
            triggerTokens: "16000",
            slidingWindow: { targetTokens: "8000" },
          },
          // Session resumption: on the first dial we just ask the server to
          // emit handles (captured in handleMessage); on a reconnect we pass
          // the latest handle back and the conversation continues mid-call.
          sessionResumption: resumeHandle ? { handle: resumeHandle } : {},
          // Voice + spoken-output language. Both live under speechConfig.
          // languageCode is BCP-47 (e.g. "hi-IN"). The previous implementation
          // passed `systemLanguageCode` at the top level — that field doesn't
          // exist on LiveConnectConfig, so the SDK silently dropped it. The
          // system prompt also carries an explicit "Respond in X" directive
          // (see api/public/agent/[slug]/session/route.ts) so the very first
          // turn lands in the chosen language even if the speech-config
          // takes a beat to kick in.
          speechConfig: {
            ...(this.voiceName
              ? { voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voiceName } } }
              : {}),
            ...(this.language ? { languageCode: this.language } : {}),
          },
        },
        callbacks: {
          onopen: () => {
            console.log("[GeminiLive] WebSocket opened (onopen)");
            this.isConnected = true;
            this.emit({ type: this.isReconnecting ? "reconnected" : "connected" });
          },
          onmessage: (message: LiveServerMessage) => {
            console.log("[GeminiLive] Received message:", Object.keys(message).filter(k => (message as unknown as Record<string, unknown>)[k] != null));
            this.handleMessage(message);
          },
          onerror: (error: ErrorEvent) => {
            console.error("[GeminiLive] WebSocket error:", error);
            this.emit({ type: "error", data: error.message || "WebSocket connection error" });
          },
          onclose: (event: CloseEvent) => {
            this.isConnected = false;
            this.isSetupComplete = false;
            console.info("[GeminiLive] WebSocket closed. code:", event.code, "reason:", event.reason, "isDisconnecting:", this.isDisconnecting);
            if (this.isDisconnecting) return;
            // A reconnect attempt's own socket closing is handled by
            // attemptReconnect's retry logic — don't double-report.
            if (this.isReconnecting) return;
            // Abnormal drop (network blip 1006 / server error 1011) with a
            // resumption handle in hand → try to continue the same call.
            const abnormal = event.code === 1006 || event.code === 1011;
            if (abnormal && this.resumptionHandle && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              void this.attemptReconnect();
              return;
            }
            if (event.code && event.code !== 1000) {
              this.emit({
                type: "error",
                data: `Connection closed (code ${event.code}): ${event.reason || "Unknown reason"}`,
              });
            }
            this.emit({ type: "disconnected" });
          },
        },
      });

      this.session = session;
  }

  /**
   * Try to resume the call after an abnormal drop (Item 10). Waits briefly
   * for the network to return, re-dials with the captured resumption handle,
   * and lets the setupComplete handler flush any mic audio queued during the
   * gap. Gives up after MAX_RECONNECT_ATTEMPTS and reports the disconnect.
   */
  private async attemptReconnect() {
    if (this.isReconnecting || this.isDisconnecting) return;
    this.isReconnecting = true;
    this.reconnectAttempts++;
    console.warn(`[GeminiLive] Attempting reconnect ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    this.emit({ type: "reconnecting", data: { attempt: this.reconnectAttempts } });

    // Halt any scheduled playback from the dead session.
    for (const source of this.activeSourceNodes) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.activeSourceNodes.clear();
    this.nextPlayTime = 0;

    // If the browser knows it's offline, wait (up to 8s) for it to come back
    // before burning an attempt, then a small growing backoff.
    const onlineDeadline = Date.now() + 8_000;
    while (typeof navigator !== "undefined" && !navigator.onLine && Date.now() < onlineDeadline) {
      await new Promise((r) => setTimeout(r, 250));
    }
    await new Promise((r) => setTimeout(r, 300 * this.reconnectAttempts));

    if (this.isDisconnecting) {
      this.isReconnecting = false;
      return;
    }

    try {
      await this.openSession(this.resumptionHandle);
      this.isReconnecting = false;
      console.log("[GeminiLive] Reconnected with resumption handle");
    } catch (err) {
      this.isReconnecting = false;
      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !this.isDisconnecting) {
        void this.attemptReconnect();
        return;
      }
      console.error("[GeminiLive] Reconnect failed permanently:", err);
      this.emit({ type: "error", data: "Connection lost and could not be restored" });
      this.emit({ type: "disconnected" });
    }
  }

  private handleMessage(message: LiveServerMessage) {
    // Handle setup complete
    if (message.setupComplete) {
      console.log("[GeminiLive] Setup complete received!");
      this.isSetupComplete = true;
      // Healthy session (fresh or resumed) — restore the reconnect budget.
      this.reconnectAttempts = 0;
      // Flush any queued audio
      if (this.audioChunkQueue.length > 0) {
        console.log("[GeminiLive] Flushing", this.audioChunkQueue.length, "queued audio chunks");
        for (const chunk of this.audioChunkQueue) {
          this.sendAudioInternal(chunk);
        }
        this.audioChunkQueue = [];
      }
      return;
    }

    // Handle server content
    const serverContent = message.serverContent;
    if (serverContent) {
      // Audio/text from model turn
      if (serverContent.modelTurn?.parts) {
        for (const part of serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            console.log("[GeminiLive] Received audio data, length:", part.inlineData.data.length);
            this.emit({ type: "agent-speaking" });
            try {
              const audioData = pcm16Base64ToFloat32(part.inlineData.data);
              if (this.audioContext) {
                if (this.audioContext.state === "suspended") {
                  this.audioContext.resume().catch(() => {});
                }
                this.scheduleAudioPlayback(audioData);
              }
              this.emit({ type: "audio", data: audioData });
            } catch (audioErr) {
              console.error("[GeminiLive] Audio playback error:", audioErr);
              this.emit({ type: "agent-done" });
            }
          }
          if (part.text) {
            console.log("[GeminiLive] Received text:", part.text.substring(0, 100));
            this.emit({ type: "transcript", data: { speaker: "agent", text: part.text } });
          }
        }
      }

      // Input transcription (what the user said)
      if (serverContent.inputTranscription?.text) {
        console.log("[GeminiLive] Input transcription:", serverContent.inputTranscription.text);
        this.emit({
          type: "transcript",
          data: {
            speaker: "user",
            text: serverContent.inputTranscription.text,
            isPartial: !serverContent.inputTranscription.finished,
          },
        });
      }

      // Output transcription (what the agent said, text form of audio)
      if (serverContent.outputTranscription?.text) {
        console.log("[GeminiLive] Output transcription:", serverContent.outputTranscription.text);
        this.emit({
          type: "transcript",
          data: {
            speaker: "agent",
            text: serverContent.outputTranscription.text,
            isPartial: !serverContent.outputTranscription.finished,
          },
        });
      }

      // Turn complete
      if (serverContent.turnComplete) {
        console.log("[GeminiLive] Turn complete");
        this.emit({ type: "agent-done" });
      }

      // Interrupted
      if (serverContent.interrupted) {
        console.log("[GeminiLive] Server signaled interruption");
        this.interrupt();
      }
    }

    // Handle tool calls (async to allow DB lookups via the data API)
    if (message.toolCall?.functionCalls) {
      void (async () => {
        for (const fc of message.toolCall!.functionCalls!) {
          try {
            console.log("[GeminiLive] Tool call:", fc.name);
            let result = handleAgentToolCall(this.agentType, fc.name!, fc.args || {});
            // Track interview tool calls locally
            if (fc.name === "scoreAnswer" && fc.args) {
              this.interviewScores.push({
                round: Number(fc.args.round) || 0,
                questionNumber: fc.args.questionNumber != null ? Number(fc.args.questionNumber) : undefined,
                question: fc.args.question as string | undefined,
                answerSummary: fc.args.answerSummary as string | undefined,
                score: Number(fc.args.score) || 0,
                feedback: fc.args.feedback as string | undefined,
              });
            } else if (fc.name === "advanceRound" && fc.args) {
              this.interviewRounds.push({ round: Number(fc.args.nextRound) || 0, summary: fc.args.summary as string | undefined });
            } else if (fc.name === "endInterview" && fc.args) {
              this.interviewResult = { overallImpression: fc.args.overallImpression as string, overallFeedback: fc.args.overallFeedback as string | undefined };
            } else if (fc.name === "captureLead" && fc.args) {
              // Persist immediately so a mid-call disconnect doesn't lose the lead.
              await this.persistCapturedLead(fc.args);
            } else if (fc.name === "searchKnowledge" && fc.args) {
              // Dynamic RAG retrieval — replaces the default ack with real
              // top-k snippets fetched from the owner's knowledge base.
              result = await this.searchKnowledge(String(fc.args.query ?? ""));
            } else if (fc.name === "bookAppointment" || fc.name === "confirmAppointment") {
              // Real calendar booking (server-side — bookings touch the
              // owner's actual Google Calendar). The endpoints return
              // tool-shaped fallbacks on failure, so the model degrades
              // to captureLead gracefully.
              result = await this.callBookingEndpoint(fc.name, fc.args || {});
            } else if (fc.name === "generatePaymentLink") {
              // Mid-call UPI payment link — server-side (touches Razorpay).
              result = await this.callPaymentLinkEndpoint(fc.args || {});
            }
            // For data-fetch tools, override with real data from the public API
            if (this.agentSlug && (fc.name === "getMenu" || fc.name === "listRooms" || fc.name === "listDoctors")) {
              result = await this.fetchToolData(fc.name, fc.args || {});
            }
            this.sendToolResponse(fc.id!, fc.name!, result);
          } catch (toolErr) {
            console.error("[GeminiLive] Tool call error:", fc.name, toolErr);
            this.sendToolResponse(fc.id!, fc.name!, JSON.stringify({ error: "Tool execution failed" }));
          }
        }
      })();
    }

    // Handle tool call cancellation
    if (message.toolCallCancellation) {
      console.log("[GeminiLive] Tool call cancelled:", message.toolCallCancellation.ids);
    }

    // Handle go away — server will close the WebSocket in ~60s (10-min session limit)
    if (message.goAway) {
      const remaining = message.goAway.timeLeft;
      console.warn("[GeminiLive] Server sent goAway, remaining time:", remaining);
      // Emit a special event so the UI can save the session and end the call cleanly
      // before the server forcibly drops the connection.
      this.emit({ type: "session-expiring", data: { remainingMs: remaining } });
    }

    // Capture session-resumption handles. Server emits these periodically;
    // we keep the latest one so a future reconnect feature can pass it back
    // as sessionResumption.handle on a fresh live.connect().
    if (message.sessionResumptionUpdate?.newHandle) {
      this.resumptionHandle = message.sessionResumptionUpdate.newHandle;
    }
  }

  /** Latest session-resumption handle (or null if none yet). */
  getResumptionHandle(): string | null {
    return this.resumptionHandle;
  }

  /**
   * Schedule audio chunk for sequential playback.
   * Each chunk starts after the previous one ends, preventing overlap.
   */
  private scheduleAudioPlayback(audioData: Float32Array) {
    if (!this.audioContext) return;

    const buffer = this.audioContext.createBuffer(1, audioData.length, 24000);
    buffer.copyToChannel(new Float32Array(audioData.buffer) as Float32Array<ArrayBuffer>, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    // Track active source for interrupt support
    this.activeSourceNodes.add(source);
    source.onended = () => {
      this.activeSourceNodes.delete(source);
      // If no more audio is playing, signal agent-done
      if (this.activeSourceNodes.size === 0) {
        this.emit({ type: "agent-done" });
      }
    };

    // Schedule sequentially: start after previous chunk ends
    const now = this.audioContext.currentTime;
    const startTime = Math.max(now, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
  }

  /** Fetch real business data for a tool call via the public data API */
  private async fetchToolData(toolName: string, args: Record<string, unknown>): Promise<string> {
    try {
      const res = await fetch(`/api/public/agent/${this.agentSlug}/data`);
      if (!res.ok) throw new Error("data fetch failed");
      const payload = await res.json() as { templateType: string; data: { dataType: string; data: unknown }[] };

      if (toolName === "getMenu") {
        const menuEntry = payload.data.find((d) => d.dataType === "menu");
        const items = (menuEntry?.data as { items?: unknown[] })?.items ?? [];
        const category = typeof args.category === "string" ? args.category : null;
        const filtered = category ? items.filter((i) => (i as Record<string, unknown>).category === category) : items;
        return JSON.stringify({ items: filtered });
      }

      if (toolName === "listRooms") {
        const roomEntry = payload.data.find((d) => d.dataType === "rooms");
        const rooms = (roomEntry?.data as { rooms?: unknown[] })?.rooms ?? [];
        return JSON.stringify({ rooms });
      }

      if (toolName === "listDoctors") {
        const doctorEntry = payload.data.find((d) => d.dataType === "doctors");
        const doctors = (doctorEntry?.data as { doctors?: unknown[] })?.doctors ?? [];
        const day = typeof args.day === "string" ? args.day : null;
        const filtered = day
          ? doctors.filter((d) => {
              const days = (d as Record<string, unknown>).availableDays;
              return Array.isArray(days) && (days as string[]).includes(day);
            })
          : doctors;
        return JSON.stringify({ doctors: filtered });
      }
    } catch {
      // Fall through to default mock
    }
    // Fallback: return default mock via existing handler
    return handleAgentToolCall(this.agentType, toolName, args);
  }

  /**
   * Persist a captured lead to the session via the authenticated public PATCH.
   * The agent calls captureLead any time the caller wants to book/order/schedule,
   * so we write immediately rather than waiting for end-of-call to avoid losing
   * the lead on a network drop.
   */
  /**
   * Dynamic RAG retrieval. The agent calls this when the conversation
   * pivots to a topic the static prompt's one-shot retrieval didn't cover.
   * Returns top-k snippets formatted as a JSON tool response that the model
   * can read inline.
   */
  private async searchKnowledge(query: string): Promise<string> {
    if (!query.trim()) {
      return JSON.stringify({ error: "empty query" });
    }
    if (!this.sessionId || !this.updateToken || !this.agentSlug) {
      return JSON.stringify({ error: "session not ready" });
    }
    try {
      const res = await fetch(
        `/api/public/agent/${this.agentSlug}/search-knowledge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.updateToken}`,
          },
          body: JSON.stringify({ sessionId: this.sessionId, query, k: 5 }),
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("[GeminiLive] searchKnowledge failed:", res.status, text);
        return JSON.stringify({ error: `search failed (${res.status})`, results: [] });
      }
      const data = (await res.json()) as { results?: { title: string; content: string; category: string; score: number }[] };
      // The model handles short-form JSON arrays better than long prose.
      // Truncate content per snippet so the model doesn't drown.
      const results = (data.results ?? []).map((r) => ({
        title: r.title,
        category: r.category,
        score: Number(r.score.toFixed(3)),
        content: r.content.length > 600 ? r.content.slice(0, 600) + "..." : r.content,
      }));
      return JSON.stringify({ results });
    } catch (err) {
      console.warn("[GeminiLive] searchKnowledge error:", err);
      return JSON.stringify({ error: "search error", results: [] });
    }
  }

  /**
   * Dispatch a booking tool call to the authenticated public booking
   * endpoints (Item 7). Uses the same per-session bearer token as
   * searchKnowledge / session PATCH.
   */
  private async callBookingEndpoint(
    toolName: "bookAppointment" | "confirmAppointment",
    args: Record<string, unknown>,
  ): Promise<string> {
    if (!this.sessionId || !this.updateToken || !this.agentSlug) {
      return JSON.stringify({
        error: "session not ready",
        fallback: "captureLead",
        message: "Booking is unavailable — capture the caller's details with captureLead instead.",
      });
    }
    const path = toolName === "bookAppointment" ? "book-appointment" : "confirm-appointment";
    try {
      const res = await fetch(`/api/public/agent/${this.agentSlug}/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.updateToken}`,
        },
        body: JSON.stringify({ sessionId: this.sessionId, ...args }),
      });
      const text = await res.text();
      // Booking endpoints answer tool-shaped JSON on both success AND
      // failure paths; only a transport-level breakdown lands in catch.
      try {
        JSON.parse(text);
        return text;
      } catch {
        return JSON.stringify({
          error: `booking failed (${res.status})`,
          fallback: "captureLead",
          message: "Booking hit a technical problem — apologize and use captureLead instead.",
        });
      }
    } catch (err) {
      console.warn(`[GeminiLive] ${toolName} error:`, err);
      return JSON.stringify({
        error: "booking error",
        fallback: "captureLead",
        message: "Booking hit a technical problem — apologize and use captureLead instead.",
      });
    }
  }

  /** Dispatch generatePaymentLink to the authenticated public endpoint (Item 8). */
  private async callPaymentLinkEndpoint(args: Record<string, unknown>): Promise<string> {
    if (!this.sessionId || !this.updateToken || !this.agentSlug) {
      return JSON.stringify({ error: "session not ready", message: "Payment links are unavailable right now — continue without payment." });
    }
    try {
      const res = await fetch(`/api/public/agent/${this.agentSlug}/payment-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.updateToken}`,
        },
        body: JSON.stringify({ sessionId: this.sessionId, ...args }),
      });
      const text = await res.text();
      try {
        JSON.parse(text);
        return text;
      } catch {
        return JSON.stringify({ error: `payment link failed (${res.status})`, message: "Payment link could not be created — apologize and continue without payment." });
      }
    } catch (err) {
      console.warn("[GeminiLive] generatePaymentLink error:", err);
      return JSON.stringify({ error: "payment link error", message: "Payment link could not be created — apologize and continue without payment." });
    }
  }

  private async persistCapturedLead(args: Record<string, unknown>): Promise<void> {
    if (!this.sessionId || !this.updateToken || !this.agentSlug) {
      console.warn("[GeminiLive] captureLead fired but session token/id not available; lead not persisted");
      return;
    }
    try {
      const res = await fetch(
        `/api/public/agent/${this.agentSlug}/session/${this.sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.updateToken}`,
          },
          body: JSON.stringify({ capturedLead: args }),
        },
      );
      if (!res.ok) {
        console.warn("[GeminiLive] Lead persist failed:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.warn("[GeminiLive] Lead persist error:", err);
    }
  }

  private sendToolResponse(callId: string, functionName: string, result: string) {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.sendToolResponse({
        functionResponses: [{ id: callId, name: functionName, response: JSON.parse(result) }],
      });
    } catch (err) {
      console.warn("[GeminiLive] Tool response send failed:", err);
    }
  }

  /**
   * Check if the underlying WebSocket is open.
   * The SDK wraps native WebSocket in BrowserWebSocket, so we need
   * to access the internal `.ws` property.
   */
  private isWebSocketOpen(): boolean {
    if (!this.session) return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conn = this.session.conn as any;
      // BrowserWebSocket stores the native WebSocket in .ws
      const ws: WebSocket | undefined = conn?.ws ?? conn;
      return !!ws && ws.readyState === WebSocket.OPEN;
    } catch {
      return this.isConnected;
    }
  }

  /**
   * Send audio data via sendRealtimeInput({ audio }).
   * The `audio` field is for audio blobs; `media` is for images.
   * Per SDK: audio.data is base64-encoded, audio.mimeType is the audio format.
   */
  private sendAudioInternal(base64Audio: string) {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.sendRealtimeInput({
        audio: { data: base64Audio, mimeType: "audio/pcm;rate=16000" },
      });
    } catch (sendErr) {
      if (!this.isDisconnecting) {
        console.warn("[GeminiLive] Audio send failed:", sendErr);
      }
    }
  }

  sendAudio(base64Audio: string) {
    if (this.isDisconnecting) return;
    // During a reconnect window, buffer the caller's mic so the first words
    // after the blip aren't lost. Flushed by the setupComplete handler.
    if (this.isReconnecting) {
      if (this.audioChunkQueue.length < MAX_QUEUED_AUDIO_CHUNKS) {
        this.audioChunkQueue.push(base64Audio);
      }
      return;
    }
    if (!this.session || !this.isConnected) return;
    if (!this.isSetupComplete) {
      if (this.audioChunkQueue.length < MAX_QUEUED_AUDIO_CHUNKS) {
        this.audioChunkQueue.push(base64Audio);
      }
      return;
    }
    this.sendAudioInternal(base64Audio);
  }

  /**
   * For gemini-3.1-flash-live-preview, sendClientContent is only supported
   * for seeding initial context history. After the first model turn, use
   * sendRealtimeInput with the text field instead.
   */
  sendText(text: string) {
    if (!this.session || !this.isConnected || this.isDisconnecting) return;
    try {
      this.session.sendRealtimeInput({ text });
    } catch {
      // Ignore send errors during disconnect
    }
  }

  interrupt() {
    // Stop all scheduled audio sources
    for (const source of this.activeSourceNodes) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.activeSourceNodes.clear();
    this.nextPlayTime = 0;
    this.emit({ type: "interrupted" });
  }

  disconnect() {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;
    this.isConnected = false;

    // Stop all audio playback
    for (const source of this.activeSourceNodes) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.activeSourceNodes.clear();
    this.nextPlayTime = 0;

    if (this.session) {
      try {
        // session.close() is synchronous (returns void)
        this.session.close();
      } catch {
        // Ignore close errors
      }
      this.session = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.emit({ type: "disconnected" });
  }

  getIsConnected() {
    return this.isConnected;
  }

  /** Get collected interview scores/rounds/result for session persistence */
  getInterviewData() {
    if (this.interviewScores.length === 0 && !this.interviewResult) return null;
    return {
      scores: this.interviewScores,
      rounds: this.interviewRounds,
      result: this.interviewResult,
    };
  }
}
