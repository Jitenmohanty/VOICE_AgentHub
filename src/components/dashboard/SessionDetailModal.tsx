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
  UserCheck,
  Flame,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { getAgentById } from "@/lib/agents";
import { formatIST, formatISTTime } from "@/lib/format-date";
import type { AgentSessionData, TranscriptMessage } from "@/types/session";

interface SessionDetailModalProps {
  sessionId: string;
  onClose: () => void;
}

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "#A78BFA" },
  { value: "contacted", label: "Contacted", color: "#60A5FA" },
  { value: "qualified", label: "Qualified", color: "#FCD34D" },
  { value: "won", label: "Won", color: "#34D399" },
  { value: "lost", label: "Lost", color: "#FB7185" },
  { value: "archived", label: "Archived", color: "#94A3B8" },
] as const;

type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export function SessionDetailModal({ sessionId, onClose }: SessionDetailModalProps) {
  const [session, setSession] = useState<AgentSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => setSession(data.session || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const updateLeadStatus = async (newStatus: LeadStatus) => {
    if (!session || updatingStatus) return;
    setUpdatingStatus(true);
    // Optimistic update
    const prev = session.leadStatus;
    setSession({ ...session, leadStatus: newStatus });
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatus: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status: ${newStatus}`);
    } catch {
      // Revert on failure
      setSession({ ...session, leadStatus: prev });
      toast.error("Couldn't update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ah-bg-deep)]/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] glass-floating rounded-3xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              {template && (
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${template?.accentColor || "#7C3AED"}30, ${template?.accentColor || "#3B82F6"}10)`,
                    border: `1px solid ${template?.accentColor || "#7C3AED"}30`,
                  }}
                >
                  <Bot className="w-4 h-4" style={{ color: template?.accentColor || "#A78BFA" }} strokeWidth={2} />
                </div>
              )}
              <div>
                <h2 className="font-serif text-2xl tracking-tight text-white">
                  {session?.title || agentName}
                </h2>
                {session && (
                  <span
                    className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium border capitalize ${
                      session.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-300/20"
                        : session.status === "active"
                          ? "bg-violet-500/15 text-violet-300 border-violet-300/20"
                          : "bg-rose-500/15 text-rose-300 border-rose-300/20"
                    }`}
                  >
                    {session.status}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/[0.06] text-white/55 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="h-5 w-1/3 bg-white/[0.06] rounded" />
              <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
              <div className="h-32 w-full bg-white/[0.06] rounded" />
            </div>
          ) : !session ? (
            <div className="p-8 text-center text-white/55">
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
                  color="#A78BFA"
                />
                <StatCard
                  icon={StopCircle}
                  label="Ended"
                  value={endTime ? formatISTTime(endTime) : "—"}
                  color="#FB7185"
                />
                <StatCard
                  icon={Clock}
                  label="Duration"
                  value={session.duration != null ? formatDuration(session.duration) : "—"}
                  color="#FCD34D"
                />
                <StatCard
                  icon={MessageSquare}
                  label="Messages"
                  value={String(transcript.length)}
                  color="#22D3EE"
                />
              </div>

              {/* Rating */}
              {typeof session.rating === "number" && session.rating > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/55">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= session.rating! ? "text-amber-300" : "text-white/15"}`}
                        style={{ fill: s <= session.rating! ? "currentColor" : "transparent" }}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  {session.feedback && (
                    <span className="text-white/40 italic ml-2">
                      &ldquo;{session.feedback}&rdquo;
                    </span>
                  )}
                </div>
              )}

              {/* Captured Lead + status workflow */}
              {(session.capturedLead || session.callerName || session.callerPhone || session.callerEmail) && (
                <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#10B981]" />
                      Captured lead
                    </h3>
                    <select
                      value={(session.leadStatus as LeadStatus) || "new"}
                      onChange={(e) => updateLeadStatus(e.target.value as LeadStatus)}
                      disabled={updatingStatus}
                      className="text-xs h-8 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 text-white focus:outline-none focus:border-violet-300/50 disabled:opacity-50"
                      style={{
                        color: LEAD_STATUSES.find((s) => s.value === session.leadStatus)?.color ?? "#A78BFA",
                      }}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s.value} value={s.value} className="bg-[var(--ah-bg-raised)] text-white">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {session.capturedLead?.intent && (
                    <div>
                      <p className="text-xs text-white/55 uppercase tracking-wider">Intent</p>
                      <p className="text-base text-white mt-1">{session.capturedLead.intent}</p>
                      {session.capturedLead.urgency && (
                        <span
                          className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            backgroundColor:
                              session.capturedLead.urgency === "high" ? "rgba(239,68,68,0.15)" :
                              session.capturedLead.urgency === "medium" ? "rgba(255,184,0,0.15)" :
                              "rgba(16,185,129,0.15)",
                            color:
                              session.capturedLead.urgency === "high" ? "#EF4444" :
                              session.capturedLead.urgency === "medium" ? "#FFB800" :
                              "#10B981",
                          }}
                        >
                          {session.capturedLead.urgency}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {session.callerName && (
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Name</p>
                        <p className="text-white mt-0.5">{session.callerName}</p>
                      </div>
                    )}
                    {session.callerPhone && (
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Phone</p>
                        <a href={`tel:${session.callerPhone}`} className="ah-gradient-text font-medium hover:opacity-80 mt-0.5 block">
                          {session.callerPhone}
                        </a>
                      </div>
                    )}
                    {session.callerEmail && (
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Email</p>
                        <a href={`mailto:${session.callerEmail}`} className="ah-gradient-text font-medium hover:opacity-80 mt-0.5 block">
                          {session.callerEmail}
                        </a>
                      </div>
                    )}
                  </div>

                  {session.capturedLead?.notes && (
                    <div>
                      <p className="text-xs text-white/55 uppercase tracking-wider">Notes</p>
                      <p className="text-sm text-white/75 mt-1 leading-relaxed">{session.capturedLead.notes}</p>
                    </div>
                  )}

                  {session.suggestedReply && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-white/55 uppercase tracking-wider">Suggested reply</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(session.suggestedReply!)
                              .then(() => toast.success("Reply copied"))
                              .catch(() => toast.error("Couldn't copy"));
                          }}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/65 hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-sm text-white/75 mt-1.5 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-2.5 italic">
                        {session.suggestedReply}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Call recording (Item 12) */}
              {session.recordingKey && <RecordingPlayer sessionId={sessionId} />}

              {/* Summary */}
              {summary && (
                <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
                  <h3 className="text-base font-semibold text-white mb-2">Summary</h3>
                  <p className="text-base text-white/65 leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Interview Scores (for interview agent sessions) */}
              {session.agent?.templateType === "interview" && isInterviewData(session.actionItems) && (
                <InterviewScorePanel data={session.actionItems as InterviewData} />
              )}

              {/* AI Analysis (from Claude) */}
              {Boolean(session.sentiment || (session.topics && session.topics.length > 0) || (session.actionItems && !isInterviewData(session.actionItems))) && (
                <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] space-y-3">
                  <h3 className="text-base font-semibold text-white">AI Analysis</h3>

                  {/* Sentiment */}
                  {session.sentiment && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white/55">Sentiment:</span>
                      <span
                        className={`text-sm font-medium px-2.5 py-0.5 rounded-full capitalize border ${
                          session.sentiment === "positive"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-300/20"
                            : session.sentiment === "negative"
                              ? "bg-rose-500/15 text-rose-300 border-rose-300/20"
                              : session.sentiment === "mixed"
                                ? "bg-amber-500/15 text-amber-300 border-amber-300/20"
                                : "bg-white/[0.06] text-white/55 border-white/10"
                        }`}
                      >
                        {String(session.sentiment)}
                        {session.sentimentScore != null && ` (${(Number(session.sentimentScore) * 100).toFixed(0)}%)`}
                      </span>
                      {session.escalated && (
                        <span className="text-sm px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-300/20">
                          Escalation needed
                        </span>
                      )}
                    </div>
                  )}

                  {/* AI lead score + intent category */}
                  {(session.leadScore != null || session.intentCategory) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {session.leadScore != null && (
                        <>
                          <span className="text-sm text-white/55">Lead score:</span>
                          <span
                            className={`text-sm font-medium px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 tabular-nums ${
                              session.leadScore >= 70
                                ? "bg-orange-500/15 text-orange-300 border-orange-300/30"
                                : session.leadScore >= 40
                                  ? "bg-amber-500/10 text-amber-300 border-amber-300/20"
                                  : "bg-white/[0.06] text-white/55 border-white/10"
                            }`}
                          >
                            <Flame className="w-3 h-3" />
                            {session.leadScore}/100
                          </span>
                        </>
                      )}
                      {session.intentCategory && (
                        <span className="text-sm px-2.5 py-0.5 rounded-full capitalize bg-cyan-500/10 text-cyan-300 border border-cyan-300/20">
                          {session.intentCategory}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Topics */}
                  {session.topics && session.topics.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white/55">Topics:</span>
                      {session.topics.map((topic: string, i: number) => (
                        <span
                          key={i}
                          className="text-sm px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-200 border border-violet-300/20"
                        >
                          {String(topic)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Items */}
                  {Array.isArray(session.actionItems) && (session.actionItems as { action: string; priority: string }[]).length > 0 && (
                    <div>
                      <span className="text-sm text-white/55 block mb-1">Action Items:</span>
                      <ul className="space-y-1">
                        {(session.actionItems as { action: string; priority: string }[]).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span
                              className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  item.priority === "high" ? "#EF4444" :
                                  item.priority === "medium" ? "#FFB800" :
                                  "#10B981",
                              }}
                            />
                            <span className="text-white/85">{item.action}</span>
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
                  <h3 className="text-base font-semibold text-white mb-3">
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
                          className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background:
                              msg.speaker === "user"
                                ? "rgba(124,58,237,0.15)"
                                : `${template?.accentColor || "#7C3AED"}25`,
                            border:
                              msg.speaker === "user"
                                ? "1px solid rgba(167,139,250,0.25)"
                                : `1px solid ${template?.accentColor || "#7C3AED"}30`,
                          }}
                        >
                          {msg.speaker === "user" ? (
                            <User className="w-3.5 h-3.5 text-violet-300" strokeWidth={2} />
                          ) : (
                            <Bot
                              className="w-3.5 h-3.5"
                              style={{ color: template?.accentColor || "#A78BFA" }}
                              strokeWidth={2}
                            />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-base ${
                            msg.speaker === "user"
                              ? "bg-violet-500/12 border border-violet-300/20 text-white"
                              : "bg-white/[0.04] border border-white/10 text-white/85"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                          {msg.timestamp && (
                            <p className="text-xs text-white/40 mt-1">
                              {formatISTTime(msg.timestamp)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white/55">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-base">No transcript recorded for this session.</p>
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

/**
 * Lazily fetches a short-lived presigned URL and renders a native audio
 * player. The URL is only requested when the owner actually clicks Load —
 * no storage traffic for sessions nobody listens to.
 */
function RecordingPlayer({ sessionId }: { sessionId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/recording`);
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d.error || "failed");
      setUrl(d.url);
    } catch {
      toast.error("Couldn't load the recording");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
      <h3 className="text-base font-semibold text-white mb-3">Call recording</h3>
      {url ? (
        <audio controls src={url} className="w-full" preload="none" />
      ) : (
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border bg-white/[0.04] border-white/10 text-white/75 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load recording"}
        </button>
      )}
    </div>
  );
}

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
    <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.06] text-center">
      <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
      <p className="text-white text-base font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-white/45 uppercase tracking-wider mt-0.5">{label}</p>
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
    <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-[#6366F1]" />
          Interview Scores
        </h3>
        {scores.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/55">Average:</span>
            <span className="text-base font-bold text-white">{avgScore}/10</span>
          </div>
        )}
      </div>

      {/* Overall Result */}
      {result?.overallImpression && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/10">
          <Award className="w-5 h-5 shrink-0" style={{ color: impressionColor }} />
          <div>
            <span
              className="text-sm font-semibold px-2.5 py-0.5 rounded-full capitalize"
              style={{ backgroundColor: `${impressionColor}15`, color: impressionColor }}
            >
              {result.overallImpression.replace("_", " ")}
            </span>
            {result.overallFeedback && (
              <p className="text-sm text-white/65 mt-1.5 leading-relaxed">{result.overallFeedback}</p>
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
                <span className="text-sm font-medium text-white">
                  Round {round}: {ROUND_NAMES[round] || `Round ${round}`}
                </span>
                <span className="text-sm font-semibold" style={{ color: roundAvg >= 7 ? "#10B981" : roundAvg >= 5 ? "#FFB800" : "#EF4444" }}>
                  {roundAvg}/10
                </span>
              </div>
              {/* Score bar */}
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
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
                    className="text-xs font-mono shrink-0 w-6 text-center py-0.5 rounded"
                    style={{
                      backgroundColor: q.score >= 7 ? "rgba(16,185,129,0.1)" : q.score >= 5 ? "rgba(255,184,0,0.1)" : "rgba(239,68,68,0.1)",
                      color: q.score >= 7 ? "#10B981" : q.score >= 5 ? "#FFB800" : "#EF4444",
                    }}
                  >
                    {q.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    {q.question && <p className="text-xs text-white/85 truncate">{q.question}</p>}
                    {q.feedback && <p className="text-xs text-white/40 truncate">{q.feedback}</p>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
    </div>
  );
}