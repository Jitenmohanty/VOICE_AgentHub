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
import { Button } from "@/components/ui/button";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { formatIST } from "@/lib/format-date";
import { getAgentById } from "@/lib/agents";
import type { AgentSessionData } from "@/types/session";

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
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white">All Sessions</h1>
        <p className="text-[#8888AA] mt-1">
          All customer conversations across your agents
          {total > 0 && <span className="ml-2 text-[#666680]">({total} total)</span>}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/5 rounded mb-2" />
              <div className="h-4 w-1/3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-[#8888AA]/30 mx-auto mb-4" />
          <p className="text-[#8888AA] text-lg">No sessions yet</p>
          <p className="text-[#666680] text-sm mt-1">Share your agent link to start receiving calls</p>
        </div>
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedId(session.id)}
                  className="glass rounded-xl p-5 group cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white" style={{ color: template?.accentColor }}>
                          {displayName}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: session.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(0,212,255,0.1)",
                            color: session.status === "completed" ? "#10B981" : "#00D4FF",
                          }}
                        >
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#8888AA]">
                        <span>{formatIST(session.createdAt)}</span>
                        {session.duration != null && session.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {Math.floor(session.duration / 60)}m {session.duration % 60}s
                          </span>
                        )}
                        {transcript.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> {transcript.length} messages
                          </span>
                        )}
                        {session.agent?.name && (
                          <span className="text-[#666680]">via {session.agent.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {session.rating != null && session.rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">{session.rating}</span>
                        </div>
                      )}
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-[#8888AA] hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                onClick={() => fetchSessions(page - 1)}
                disabled={page <= 1}
                variant="outline" size="sm"
                className="border-[#2A2A3E] text-white disabled:opacity-30 gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <span className="text-xs text-[#8888AA]">Page {page} of {totalPages}</span>
              <Button
                onClick={() => fetchSessions(page + 1)}
                disabled={page >= totalPages}
                variant="outline" size="sm"
                className="border-[#2A2A3E] text-white disabled:opacity-30 gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
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
