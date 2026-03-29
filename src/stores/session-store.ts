import { create } from "zustand";
import type { TranscriptMessage } from "@/types/session";
import type { ConnectionState } from "@/types/gemini";

interface SessionStore {
  connectionState: ConnectionState;
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  isMuted: boolean;
  transcript: TranscriptMessage[];
  sessionId: string | null;
  elapsedSeconds: number;
  error: string | null;

  setConnectionState: (state: ConnectionState) => void;
  setAgentSpeaking: (speaking: boolean) => void;
  setUserSpeaking: (speaking: boolean) => void;
  toggleMute: () => void;
  addMessage: (message: TranscriptMessage) => void;
  updateMessage: (id: string, text: string) => void;
  updateLastMessage: (text: string) => void;
  setSessionId: (id: string) => void;
  setElapsedSeconds: (seconds: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  connectionState: "disconnected",
  isAgentSpeaking: false,
  isUserSpeaking: false,
  isMuted: false,
  transcript: [],
  sessionId: null,
  elapsedSeconds: 0,
  error: null,

  setConnectionState: (state) => set({ connectionState: state }),
  setAgentSpeaking: (speaking) => set({ isAgentSpeaking: speaking }),
  setUserSpeaking: (speaking) => set({ isUserSpeaking: speaking }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  addMessage: (message) =>
    set((s) => ({ transcript: [...s.transcript, message] })),
  updateMessage: (id, text) =>
    set((s) => ({
      transcript: s.transcript.map((m) =>
        m.id === id ? { ...m, text } : m
      ),
    })),
  updateLastMessage: (text) =>
    set((s) => {
      const updated = [...s.transcript];
      const last = updated[updated.length - 1];
      if (last) {
        updated[updated.length - 1] = { ...last, text };
      }
      return { transcript: updated };
    }),
  setSessionId: (id) => set({ sessionId: id }),
  setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      connectionState: "disconnected",
      isAgentSpeaking: false,
      isUserSpeaking: false,
      isMuted: false,
      transcript: [],
      sessionId: null,
      elapsedSeconds: 0,
      error: null,
    }),
}));
