import { GoogleGenAI, Session, LiveServerMessage, Modality } from "@google/genai";
import type { AgentConfig } from "@/types/agent";
import { getAgentSystemPrompt, getAgentTools, handleAgentToolCall } from "./agent-prompts";
import { pcm16Base64ToFloat32, createAudioContext } from "./audio-utils";

export type SessionEventType =
  | "connected"
  | "disconnected"
  | "audio"
  | "transcript"
  | "agent-speaking"
  | "agent-done"
  | "error"
  | "interrupted"
  | "session-expiring";

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

  // Audio playback queue: schedule chunks sequentially to prevent overlap
  private nextPlayTime = 0;
  private activeSourceNodes: Set<AudioBufferSourceNode> = new Set();

  // Interview score tracking (populated by scoreAnswer/advanceRound/endInterview tool calls)
  private interviewScores: { round: number; questionNumber?: number; question?: string; answerSummary?: string; score: number; feedback?: string }[] = [];
  private interviewRounds: { round: number; summary?: string }[] = [];
  private interviewResult: { overallImpression?: string; overallFeedback?: string } | null = null;

  private voiceName: string | null;
  private language: string;

  constructor(
    agentType: string,
    config: AgentConfig,
    options?: { systemPrompt?: string; tools?: unknown[]; agentSlug?: string; voiceName?: string | null; language?: string },
  ) {
    this.agentType = agentType;
    this.agentSlug = options?.agentSlug || "";
    this.config = config;
    this.prebuiltPrompt = options?.systemPrompt || null;
    this.prebuiltTools = options?.tools || null;
    this.voiceName = options?.voiceName ?? null;
    this.language = options?.language || "en";
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

      const systemInstruction = this.prebuiltPrompt || getAgentSystemPrompt(this.agentType, this.config);
      const tools = (this.prebuiltTools as import("@/types/gemini").GeminiToolDeclaration[]) || getAgentTools(this.agentType);

      console.log("[GeminiLive] Connecting with model: gemini-3.1-flash-live-preview");
      console.log("[GeminiLive] System instruction length:", systemInstruction.length);
      console.log("[GeminiLive] Tools count:", tools.length);

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
          // Voice selection — uses business owner's configured voice or Gemini default
          ...(this.voiceName ? {
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: this.voiceName },
              },
            },
          } : {}),
          // Language — sets the model's spoken output language
          ...(this.language && this.language !== "en" ? {
            systemLanguageCode: this.language,
          } : {}),
        },
        callbacks: {
          onopen: () => {
            console.log("[GeminiLive] WebSocket opened (onopen)");
            this.isConnected = true;
            this.emit({ type: "connected" });
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
            if (!this.isDisconnecting) {
              if (event.code && event.code !== 1000) {
                this.emit({
                  type: "error",
                  data: `Connection closed (code ${event.code}): ${event.reason || "Unknown reason"}`,
                });
              }
              this.emit({ type: "disconnected" });
            }
          },
        },
      });

      this.session = session;
      console.log("[GeminiLive] Session created successfully");
    } catch (error) {
      console.error("[GeminiLive] Connection failed:", error);
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  private handleMessage(message: LiveServerMessage) {
    // Handle setup complete
    if (message.setupComplete) {
      console.log("[GeminiLive] Setup complete received!");
      this.isSetupComplete = true;
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
            }
            // For data-fetch tools, override with real data from the public API
            if (this.agentSlug && (fc.name === "getMenu" || fc.name === "checkAvailability" || fc.name === "checkDoctorAvailability")) {
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

      if (toolName === "checkAvailability") {
        const roomEntry = payload.data.find((d) => d.dataType === "rooms");
        const rooms = (roomEntry?.data as { rooms?: unknown[] })?.rooms ?? [];
        return JSON.stringify({ available: rooms.length > 0, rooms });
      }

      if (toolName === "checkDoctorAvailability") {
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
    if (!this.session || !this.isConnected || this.isDisconnecting) return;
    if (!this.isSetupComplete) {
      this.audioChunkQueue.push(base64Audio);
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
