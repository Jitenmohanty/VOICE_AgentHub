"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Star,
  MessageSquare,
  Calendar,
  StopCircle,
  User,
  Bot,
} from "lucide-react";
import { getAgentById } from "@/lib/agents";
import { formatIST, formatISTTime } from "@/lib/format-date";
import type { AgentSessionData, TranscriptMessage } from "@/types/session";

interface SessionDetailModalProps {
  sessionId: string;
  onClose: () => void;
}

export function SessionDetailModal({ sessionId, onClose }: SessionDetailModalProps) {
  const [session, setSession] = useState<AgentSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => setSession(data.session || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const agent = session ? getAgentById(session.agentType) : null;

  const startTime = session ? new Date(session.createdAt) : null;
  const endTime =
    startTime && session?.duration
      ? new Date(startTime.getTime() + session.duration * 1000)
      : null;

  const transcript: TranscriptMessage[] =
    (session?.transcript as unknown as TranscriptMessage[]) || [];

  // Use persisted summary if available, else build from transcript
  const summary = session?.summary || buildSummary(
    agent?.name || session?.agentType || "Agent",
    transcript.filter((m) => m.speaker === "user"),
    transcript.filter((m) => m.speaker === "agent"),
    session?.duration || 0,
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] glass rounded-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#2A2A3E]">
            <div className="flex items-center gap-3">
              {agent && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${agent.accentColor}20` }}
                >
                  <Bot className="w-5 h-5" style={{ color: agent.accentColor }} />
                </div>
              )}
              <div>
                <h2 className="font-(family-name:--font-heading) font-bold text-lg text-white">
                  {session?.title || agent?.name || session?.agentType || "Session"}
                </h2>
                {session && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        session.status === "completed"
                          ? "rgba(16,185,129,0.1)"
                          : session.status === "active"
                            ? "rgba(0,212,255,0.1)"
                            : "rgba(239,68,68,0.1)",
                      color:
                        session.status === "completed"
                          ? "#10B981"
                          : session.status === "active"
                            ? "#00D4FF"
                            : "#EF4444",
                    }}
                  >
                    {session.status}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-[#8888AA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="h-5 w-1/3 bg-white/5 rounded" />
              <div className="h-4 w-2/3 bg-white/5 rounded" />
              <div className="h-32 w-full bg-white/5 rounded" />
            </div>
          ) : !session ? (
            <div className="p-8 text-center text-[#8888AA]">
              Session not found.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={Calendar}
                  label="Started"
                  value={startTime ? formatIST(startTime) : "—"}
                  color="#00D4FF"
                />
                <StatCard
                  icon={StopCircle}
                  label="Ended"
                  value={endTime ? formatISTTime(endTime) : "—"}
                  color="#EF4444"
                />
                <StatCard
                  icon={Clock}
                  label="Duration"
                  value={session.duration != null ? formatDuration(session.duration) : "—"}
                  color="#FFB800"
                />
                <StatCard
                  icon={MessageSquare}
                  label="Messages"
                  value={String(transcript.length)}
                  color="#6366F1"
                />
              </div>

              {/* Rating */}
              {session.rating != null && session.rating > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#8888AA]">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-4 h-4"
                        style={{
                          color: s <= session.rating! ? "#FFB800" : "#2A2A3E",
                          fill: s <= session.rating! ? "#FFB800" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                  {session.feedback && (
                    <span className="text-[#666680] italic ml-2">
                      &ldquo;{session.feedback}&rdquo;
                    </span>
                  )}
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="bg-white/[0.03] rounded-xl p-4 border border-[#2A2A3E]">
                  <h3 className="text-sm font-semibold text-white mb-2">Summary</h3>
                  <p className="text-sm text-[#8888AA] leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Transcript */}
              {transcript.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Conversation Transcript
                  </h3>
                  <div className="space-y-3">
                    {transcript.map((msg, i) => (
                      <motion.div
                        key={msg.id || i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`flex gap-3 ${msg.speaker === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background:
                              msg.speaker === "user"
                                ? "rgba(0,212,255,0.1)"
                                : `${agent?.accentColor || "#6366F1"}20`,
                          }}
                        >
                          {msg.speaker === "user" ? (
                            <User className="w-3.5 h-3.5 text-[#00D4FF]" />
                          ) : (
                            <Bot
                              className="w-3.5 h-3.5"
                              style={{ color: agent?.accentColor || "#6366F1" }}
                            />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                            msg.speaker === "user"
                              ? "bg-[#00D4FF]/10 text-white"
                              : "bg-white/[0.04] text-[#E0E0F0]"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                          {msg.timestamp && (
                            <p className="text-[10px] text-[#666680] mt-1">
                              {formatISTTime(msg.timestamp)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#8888AA]">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No transcript recorded for this session.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Helpers ─────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-[#2A2A3E]">
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
      <p className="text-white text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-[#8888AA]">{label}</p>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function buildSummary(
  agentName: string,
  userMsgs: TranscriptMessage[],
  agentMsgs: TranscriptMessage[],
  durationSec: number,
): string {
  const total = userMsgs.length + agentMsgs.length;
  if (total === 0) return "";

  const durStr = durationSec > 0 ? formatDuration(durationSec) : "a brief time";
  const parts: string[] = [];
  parts.push(
    `A ${durStr} conversation with ${agentName} containing ${total} message${total !== 1 ? "s" : ""} (${userMsgs.length} from you, ${agentMsgs.length} from the agent).`
  );

  // Show what the first user message was about
  if (userMsgs.length > 0) {
    const first = userMsgs[0]!.text;
    const preview = first.length > 120 ? first.slice(0, 120) + "..." : first;
    parts.push(`You started by saying: "${preview}"`);
  }

  return parts.join(" ");
}
