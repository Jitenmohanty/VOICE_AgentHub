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
  Target,
  Award,
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

  const templateId = session?.agent?.templateType || session?.agentType;
  const template = templateId ? getAgentById(templateId) : null;
  const agentName = session?.agent?.name || template?.name || "Agent";

  const startTime = session ? new Date(session.createdAt) : null;
  const endTime =
    startTime && session?.duration
      ? new Date(startTime.getTime() + session.duration * 1000)
      : null;

  const transcript: TranscriptMessage[] =
    (session?.transcript as unknown as TranscriptMessage[]) || [];

  // Use persisted summary if available, else build from transcript
  const summary = session?.summary || buildSummary(
    agentName,
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
              {template && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${template?.accentColor || "#6366F1"}20` }}
                >
                  <Bot className="w-5 h-5" style={{ color: template?.accentColor || "#6366F1" }} />
                </div>
              )}
              <div>
                <h2 className="font-(family-name:--font-heading) font-bold text-lg text-white">
                  {session?.title || agentName}
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
              {typeof session.rating === "number" && session.rating > 0 && (
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

              {/* Interview Scores (for interview agent sessions) */}
              {session.agent?.templateType === "interview" && isInterviewData(session.actionItems) && (
                <InterviewScorePanel data={session.actionItems as InterviewData} />
              )}

              {/* AI Analysis (from Claude) */}
              {Boolean(session.sentiment || (session.topics && session.topics.length > 0) || (session.actionItems && !isInterviewData(session.actionItems))) && (
                <div className="bg-white/[0.03] rounded-xl p-4 border border-[#2A2A3E] space-y-3">
                  <h3 className="text-sm font-semibold text-white">AI Analysis</h3>

                  {/* Sentiment */}
                  {session.sentiment && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8888AA]">Sentiment:</span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor:
                            session.sentiment === "positive" ? "rgba(16,185,129,0.15)" :
                            session.sentiment === "negative" ? "rgba(239,68,68,0.15)" :
                            session.sentiment === "mixed" ? "rgba(255,184,0,0.15)" :
                            "rgba(136,136,170,0.15)",
                          color:
                            session.sentiment === "positive" ? "#10B981" :
                            session.sentiment === "negative" ? "#EF4444" :
                            session.sentiment === "mixed" ? "#FFB800" :
                            "#8888AA",
                        }}
                      >
                        {String(session.sentiment)}
                        {session.sentimentScore != null && ` (${(Number(session.sentimentScore) * 100).toFixed(0)}%)`}
                      </span>
                      {session.escalated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                          Escalation needed
                        </span>
                      )}
                    </div>
                  )}

                  {/* Topics */}
                  {session.topics && session.topics.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#8888AA]">Topics:</span>
                      {session.topics.map((topic: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                          {String(topic)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Items */}
                  {Array.isArray(session.actionItems) && (session.actionItems as { action: string; priority: string }[]).length > 0 && (
                    <div>
                      <span className="text-xs text-[#8888AA] block mb-1">Action Items:</span>
                      <ul className="space-y-1">
                        {(session.actionItems as { action: string; priority: string }[]).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span
                              className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  item.priority === "high" ? "#EF4444" :
                                  item.priority === "medium" ? "#FFB800" :
                                  "#10B981",
                              }}
                            />
                            <span className="text-[#E0E0F0]">{item.action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                                : `${template?.accentColor || "#6366F1"}20`,
                          }}
                        >
                          {msg.speaker === "user" ? (
                            <User className="w-3.5 h-3.5 text-[#00D4FF]" />
                          ) : (
                            <Bot
                              className="w-3.5 h-3.5"
                              style={{ color: template?.accentColor || "#6366F1" }}
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
/* ── Interview Score Types & Components ──────── */

interface InterviewScore {
  round: number;
  questionNumber?: number;
  question?: string;
  answerSummary?: string;
  score: number;
  feedback?: string;
}

interface InterviewData {
  scores: InterviewScore[];
  rounds: { round: number; summary?: string }[];
  result: { overallImpression?: string; overallFeedback?: string } | null;
}

function isInterviewData(data: unknown): data is InterviewData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d.scores);
}

const ROUND_NAMES: Record<number, string> = {
  1: "Introduction",
  2: "Core Language",
  3: "Framework Deep Dive",
  4: "System Design",
  5: "HR / Behavioral",
};

function InterviewScorePanel({ data }: { data: InterviewData }) {
  const { scores, result } = data;
  if (scores.length === 0 && !result) return null;

  // Group scores by round
  const byRound = new Map<number, InterviewScore[]>();
  for (const s of scores) {
    const arr = byRound.get(s.round) || [];
    arr.push(s);
    byRound.set(s.round, arr);
  }

  // Overall average
  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10) / 10
    : 0;

  const impressionColor =
    result?.overallImpression === "strong" ? "#10B981" :
    result?.overallImpression === "needs_work" ? "#EF4444" :
    "#FFB800";

  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-[#2A2A3E] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-[#6366F1]" />
          Interview Scores
        </h3>
        {scores.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8888AA]">Average:</span>
            <span className="text-sm font-bold text-white">{avgScore}/10</span>
          </div>
        )}
      </div>

      {/* Overall Result */}
      {result?.overallImpression && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-[#2A2A3E]">
          <Award className="w-5 h-5 shrink-0" style={{ color: impressionColor }} />
          <div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{ backgroundColor: `${impressionColor}15`, color: impressionColor }}
            >
              {result.overallImpression.replace("_", " ")}
            </span>
            {result.overallFeedback && (
              <p className="text-xs text-[#8888AA] mt-1 leading-relaxed">{result.overallFeedback}</p>
            )}
          </div>
        </div>
      )}

      {/* Per-Round Breakdown */}
      {Array.from(byRound.entries())
        .sort(([a], [b]) => a - b)
        .map(([round, roundScores]) => {
          const roundAvg = Math.round((roundScores.reduce((s, q) => s + q.score, 0) / roundScores.length) * 10) / 10;
          return (
            <div key={round} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">
                  Round {round}: {ROUND_NAMES[round] || `Round ${round}`}
                </span>
                <span className="text-xs font-semibold" style={{ color: roundAvg >= 7 ? "#10B981" : roundAvg >= 5 ? "#FFB800" : "#EF4444" }}>
                  {roundAvg}/10
                </span>
              </div>
              {/* Score bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(roundAvg / 10) * 100}%`,
                    backgroundColor: roundAvg >= 7 ? "#10B981" : roundAvg >= 5 ? "#FFB800" : "#EF4444",
                  }}
                />
              </div>
              {/* Individual questions */}
              {roundScores.map((q, i) => (
                <div key={i} className="flex items-start gap-2 pl-2">
                  <span
                    className="text-[10px] font-mono shrink-0 w-6 text-center py-0.5 rounded"
                    style={{
                      backgroundColor: q.score >= 7 ? "rgba(16,185,129,0.1)" : q.score >= 5 ? "rgba(255,184,0,0.1)" : "rgba(239,68,68,0.1)",
                      color: q.score >= 7 ? "#10B981" : q.score >= 5 ? "#FFB800" : "#EF4444",
                    }}
                  >
                    {q.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    {q.question && <p className="text-[11px] text-[#E0E0F0] truncate">{q.question}</p>}
                    {q.feedback && <p className="text-[10px] text-[#666680] truncate">{q.feedback}</p>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
    </div>
  );
}