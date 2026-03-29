"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TranscriptMessage } from "@/types/session";

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  accentColor: string;
}

export function TranscriptPanel({ messages, accentColor }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#8888AA] text-sm">
        Conversation will appear here...
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={
                msg.speaker === "agent"
                  ? {
                      backgroundColor: `${accentColor}10`,
                      border: `1px solid ${accentColor}20`,
                      color: "#F0F0F5",
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#F0F0F5",
                    }
              }
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
