"use client";

import { useSessionStore } from "@/stores/session-store";

export function useTranscript() {
  const transcript = useSessionStore((s) => s.transcript);
  const addMessage = useSessionStore((s) => s.addMessage);
  const updateLastMessage = useSessionStore((s) => s.updateLastMessage);

  return { transcript, addMessage, updateLastMessage };
}
