"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Star, MessageSquare, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { formatIST } from "@/lib/format-date";
import Link from "next/link";
import type { AgentSessionData } from "@/types/session";
import { GlassPanel } from "@/components/ui/glass-panel";

const PAGE_SIZE = 10;

export default function AgentSessionsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const businessId = useSearchParams().get("bid") || "";

  const [sessions, setSessions] = useState<AgentSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchSessions = useCallback((p: number) => {
    setLoading(true);
    fetch(`/api/business/${businessId}/agents/${agentId}/sessions?page=${p}&limit=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.sessions || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setPage(d.page || p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId, agentId]);

  useEffect(() => { fetchSessions(1); }, [fetchSessions]);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
        <Link
          href={`/business/agents/${agentId}?bid=${businessId}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to agent
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">History</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-white">Session history</h1>
            <p className="text-sm text-white/55 mt-1">
              {total > 0 ? `${total} total conversations` : "No conversations yet"}
            </p>
          </div>
          {businessId && total > 0 && (
            <a
              href={`/api/business/${businessId}/leads/export`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-1/3 bg-white/[0.06] rounded mb-2" />
              <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <MessageSquare className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65">No sessions yet</p>
        </GlassPanel>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const transcript = (session.transcript as unknown as { text: string }[]) || [];
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  onClick={() => setSelectedId(session.id)}
                >
                  <GlassPanel elevation="subtle" interactive radius="md" className="p-5 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h4 className="font-medium text-white text-sm tracking-tight truncate">
                          {session.title || "Voice session"}
                        </h4>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-white/55">
                          <span>{formatIST(session.createdAt)}</span>
                          {session.duration != null && session.duration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(session.duration / 60)}m {session.duration % 60}s
                            </span>
                          )}
                          {transcript.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {transcript.length}
                            </span>
                          )}
                          {session.sentiment && (
                            <span
                              className={`capitalize ${
                                session.sentiment === "positive"
                                  ? "text-emerald-300"
                                  : session.sentiment === "negative"
                                    ? "text-rose-300"
                                    : "text-white/55"
                              }`}
                            >
                              {session.sentiment}
                            </span>
                          )}
                        </div>
                        {session.callerName && (
                          <p className="text-xs text-white/40 mt-1.5">Caller: {session.callerName}</p>
                        )}
                      </div>
                      {session.rating != null && session.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-300 shrink-0">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm tabular-nums">{session.rating}</span>
                        </div>
                      )}
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
