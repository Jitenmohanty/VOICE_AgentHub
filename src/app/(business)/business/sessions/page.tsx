"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Star,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { formatIST } from "@/lib/format-date";
import { getAgentById } from "@/lib/agents";
import type { AgentSessionData } from "@/types/session";
import { GlassPanel } from "@/components/ui/glass-panel";

const PAGE_SIZE = 10;

export default function BusinessSessionsPage() {
  const [sessions, setSessions] = useState<AgentSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchSessions = useCallback((p: number) => {
    setLoading(true);
    fetch(`/api/sessions?page=${p}&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setPage(data.page || p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSessions(1); }, [fetchSessions]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setTotal((prev) => prev - 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">All conversations</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">Sessions</h1>
        <p className="text-sm text-white/55 mt-1.5">
          All customer conversations across your agents
          {total > 0 && <span className="ml-2 text-white/40">· {total} total</span>}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/[0.06] rounded mb-2" />
              <div className="h-4 w-1/3 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <MessageSquare className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65 text-lg">No sessions yet</p>
          <p className="text-white/40 text-sm mt-1">Share your agent link to start receiving calls.</p>
        </GlassPanel>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const templateId = session.agent?.templateType || session.agentType;
              const template = templateId ? getAgentById(templateId) : null;
              const displayName = session.title || session.agent?.name || template?.name || "Session";
              const transcript = (session.transcript as unknown as { text: string }[]) || [];

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  onClick={() => setSelectedId(session.id)}
                >
                  <GlassPanel elevation="subtle" interactive radius="md" className="p-5 cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <h3 className="font-semibold text-white tracking-tight">{displayName}</h3>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize ${
                              session.status === "completed"
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-300/20"
                                : "bg-violet-500/15 text-violet-300 border-violet-300/20"
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                          <span>{formatIST(session.createdAt)}</span>
                          {session.duration != null && session.duration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(session.duration / 60)}m {session.duration % 60}s
                            </span>
                          )}
                          {transcript.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {transcript.length} messages
                            </span>
                          )}
                          {session.agent?.name && (
                            <span className="text-white/40">via {session.agent.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {session.rating != null && session.rating > 0 && (
                          <div className="flex items-center gap-1 text-amber-300">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm tabular-nums">{session.rating}</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/40 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                          aria-label="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => fetchSessions(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm text-white/75 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-xs text-white/55">Page {page} of {totalPages}</span>
              <button
                onClick={() => fetchSessions(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm text-white/75 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {selectedId && (
        <SessionDetailModal sessionId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
