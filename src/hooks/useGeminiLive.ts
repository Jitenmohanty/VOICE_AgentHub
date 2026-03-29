"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GeminiLiveSession } from "@/lib/gemini/live-session";
import { useSessionStore } from "@/stores/session-store";
import type { AgentConfig } from "@/types/agent";
import type { TranscriptMessage } from "@/types/session";
import { useAudioStream } from "./useAudioStream";

export function useGeminiLive(agentType: string, config: AgentConfig) {
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const connectingRef = useRef(false);

  // Track partial transcription message IDs so we can update them
  const partialMessageIds = useRef<{ user?: string; agent?: string }>({});

  const {
    setConnectionState,
    setAgentSpeaking,
    setError,
    addMessage,
    updateMessage,
    reset,
  } = useSessionStore();

  const activeRef = useRef(true);

  const { startCapture, stopCapture } = useAudioStream({
    onAudioData: (base64Audio) => {
      if (activeRef.current) {
        sessionRef.current?.sendAudio(base64Audio);
      }
    },
    onAnalyserReady: (node) => setAnalyserNode(node),
  });

  const connect = useCallback(async () => {
    // Guard against double-clicking or rapid re-calls
    if (connectingRef.current) {
      console.warn("[VoiceCall] connect() already in progress, ignoring");
      return;
    }
    connectingRef.current = true;

    try {
      // Tear down any existing session before starting fresh
      if (sessionRef.current) {
        console.log("[VoiceCall] Cleaning up previous session before reconnect");
        activeRef.current = false;
        stopCapture();
        sessionRef.current.disconnect();
        sessionRef.current = null;
      }

      reset();
      setConnectionState("connecting");

      // Fetch API key from server
      let res: Response;
      try {
        res = await fetch("/api/gemini/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentType, config }),
        });
      } catch (fetchErr) {
        throw new Error(
          `Network error: Could not reach session API. ${fetchErr instanceof Error ? fetchErr.message : "Check your connection."}`
        );
      }

      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body.error || JSON.stringify(body);
        } catch {
          detail = await res.text().catch(() => "");
        }
        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(
          `Session API error (${res.status}): ${detail || res.statusText}`
        );
      }

      const { apiKey, sessionId } = await res.json();

      if (!apiKey) {
        throw new Error("Server did not return an API key. Check GOOGLE_GEMINI_API_KEY on the server.");
      }

      const session = new GeminiLiveSession(agentType, config);

      session.on((event) => {
        switch (event.type) {
          case "connected":
            setConnectionState("connected");
            activeRef.current = true;
            startCapture().catch((micErr) => {
              console.error("[VoiceCall] Microphone capture failed:", micErr);
              setError(
                `Microphone error: ${micErr instanceof Error ? micErr.message : "Could not access microphone. Check browser permissions."}`
              );
            });
            break;
          case "disconnected":
            activeRef.current = false;
            setConnectionState("disconnected");
            stopCapture();
            break;
          case "agent-speaking":
            setAgentSpeaking(true);
            break;
          case "agent-done":
            setAgentSpeaking(false);
            break;
          case "transcript": {
            const data = event.data as { speaker: string; text: string; isPartial?: boolean };
            const speaker = data.speaker as "user" | "agent";

            if (data.isPartial) {
              // Partial transcription: update existing message or create new one
              const existingId = partialMessageIds.current[speaker];
              if (existingId && updateMessage) {
                updateMessage(existingId, data.text);
              } else {
                const id = crypto.randomUUID();
                partialMessageIds.current[speaker] = id;
                const msg: TranscriptMessage = {
                  id,
                  speaker,
                  text: data.text,
                  timestamp: new Date(),
                };
                addMessage(msg);
              }
            } else {
              // Final transcription: update the partial message or create a new one
              const existingId = partialMessageIds.current[speaker];
              if (existingId && updateMessage) {
                updateMessage(existingId, data.text);
                partialMessageIds.current[speaker] = undefined;
              } else {
                const msg: TranscriptMessage = {
                  id: crypto.randomUUID(),
                  speaker,
                  text: data.text,
                  timestamp: new Date(),
                };
                addMessage(msg);
              }
              partialMessageIds.current[speaker] = undefined;
            }
            break;
          }
          case "error": {
            const errData = event.data;
            const errMsg =
              errData instanceof Error
                ? errData.message
                : typeof errData === "string"
                  ? errData
                  : "WebSocket connection lost. Please retry.";
            console.error("[VoiceCall] Session error:", errData);
            setError(errMsg);
            setConnectionState("error");
            break;
          }
        }
      });

      try {
        await session.connect(apiKey);
      } catch (wsErr) {
        throw new Error(
          `Gemini connection failed: ${wsErr instanceof Error ? wsErr.message : "Could not establish WebSocket. Check API key and network."}`
        );
      }

      sessionRef.current = session;
      useSessionStore.getState().setSessionId(sessionId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Connection failed. Please try again.";
      console.error("[VoiceCall] Connect error:", err);
      setError(message);
      setConnectionState("error");
    } finally {
      connectingRef.current = false;
    }
  }, [agentType, config, reset, setConnectionState, startCapture, stopCapture, setAgentSpeaking, setError, addMessage, updateMessage]);

  const disconnectingRef = useRef(false);

  const disconnect = useCallback(() => {
    if (disconnectingRef.current) return;
    disconnectingRef.current = true;
    activeRef.current = false;
    try {
      stopCapture();
      if (sessionRef.current) {
        sessionRef.current.disconnect();
        sessionRef.current = null;
      }
      setConnectionState("disconnected");
    } finally {
      disconnectingRef.current = false;
    }
  }, [stopCapture, setConnectionState]);

  // Cleanup on unmount only — empty deps so it never re-runs mid-session
  useEffect(() => {
    return () => {
      activeRef.current = false;
      stopCapture();
      sessionRef.current?.disconnect();
      sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connect,
    disconnect,
    analyserNode,
  };
}
