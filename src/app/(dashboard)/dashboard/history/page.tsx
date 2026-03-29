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
import { getAgentById } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { formatIST } from "@/lib/format-date";
import type { AgentSessionData } from "@/types/session";

const PAGE_SIZE = 10;

export default function HistoryPage() {
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

  useEffect(() => {
    fetchSessions(1);
  }, [fetchSessions]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setTotal((prev) => prev - 1);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchSessions(p);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white">
          Session History
        </h1>
        <p className="text-[#8888AA] mt-1">
          Review your past conversations
          {total > 0 && (
            <span className="ml-2 text-[#666680]">
              ({total} total)
            </span>
          )}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/5 rounded mb-2" />
              <div className="h-4 w-1/3 bg-white/5 rounded mb-3" />
              <div className="h-3 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-[#8888AA]/30 mx-auto mb-4" />
          <p className="text-[#8888AA] text-lg">No sessions yet</p>
          <p className="text-[#666680] text-sm mt-1">
            Start a conversation with an agent to see it here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const agent = getAgentById(session.agentType);
              const transcript =
                (session.transcript as unknown as { speaker?: string; text: string }[]) || [];
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedId(session.id)}
                  className="glass rounded-xl p-5 group cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3
                          className="font-semibold text-white"
                          style={{ color: agent?.accentColor }}
                        >
                          {session.title || agent?.name || session.agentType}
                        </h3>
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
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#8888AA]">
                        <span>
                          {formatIST(session.createdAt)}
                        </span>
                        {session.duration != null && session.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {Math.floor(session.duration / 60)}m{" "}
                            {session.duration % 60}s
                          </span>
                        )}
                        {transcript.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {transcript.length} messages
                          </span>
                        )}
                      </div>
                      {/* Preview of first message */}
                      {transcript.length > 0 && (
                        <p className="text-xs text-[#666680] mt-2 line-clamp-1">
                          {transcript[0]?.text}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {session.rating != null && session.rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">{session.rating}</span>
                        </div>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.id);
                        }}
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-[#8888AA] hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {session.feedback && (
                    <p className="text-sm text-[#666680] mt-2 italic">
                      &ldquo;{session.feedback}&rdquo;
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                variant="outline"
                size="icon"
                className="border-[#2A2A3E] text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {generatePageNumbers(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 text-[#8888AA]">
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    variant={p === page ? "default" : "outline"}
                    className={
                      p === page
                        ? "bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 border-0"
                        : "border-[#2A2A3E] text-white"
                    }
                    size="icon"
                  >
                    {p}
                  </Button>
                )
              )}

              <Button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                variant="outline"
                size="icon"
                className="border-[#2A2A3E] text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedId && (
        <SessionDetailModal
          sessionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

/** Generate page numbers with ellipsis for large page counts */
function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
