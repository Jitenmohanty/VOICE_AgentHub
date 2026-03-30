"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Star, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { formatIST } from "@/lib/format-date";
import Link from "next/link";
import type { AgentSessionData } from "@/types/session";

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
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href={`/business/agents/${agentId}?bid=${businessId}`} className="flex items-center gap-1 text-sm text-[#8888AA] hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </Link>
        <h1 className="font-(family-name:--font-heading) text-2xl font-bold text-white">Session History</h1>
        <p className="text-sm text-[#8888AA]">
          {total > 0 ? `${total} total conversations` : "No conversations yet"}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-5 w-1/3 bg-white/5 rounded mb-2" />
              <div className="h-4 w-2/3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-[#8888AA]/30 mx-auto mb-4" />
          <p className="text-[#8888AA]">No sessions yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const transcript = (session.transcript as unknown as { text: string }[]) || [];
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedId(session.id)}
                  className="glass rounded-xl p-5 cursor-pointer hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white text-sm">
                        {session.title || "Voice Session"}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#8888AA]">
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
                          <span className={`capitalize ${session.sentiment === "positive" ? "text-green-400" : session.sentiment === "negative" ? "text-red-400" : ""}`}>
                            {session.sentiment}
                          </span>
                        )}
                      </div>
                      {session.callerName && (
                        <p className="text-xs text-[#666680] mt-1">Caller: {session.callerName}</p>
                      )}
                    </div>
                    {session.rating != null && session.rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">{session.rating}</span>
                      </div>
                    )}
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
