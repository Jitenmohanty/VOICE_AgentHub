"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
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
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-white/40">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center">
          <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <p className="text-xs">Conversation will appear here…</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-2.5 pr-1.5"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const isAgent = msg.speaker === "agent";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed text-white/90 ${
                  isAgent
                    ? "rounded-2xl rounded-tl-md"
                    : "rounded-2xl rounded-tr-md bg-white/[0.06] border border-white/10"
                }`}
                style={
                  isAgent
                    ? {
                        background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}10)`,
                        border: `1px solid ${accentColor}28`,
                      }
                    : undefined
                }
              >
                {msg.text}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
