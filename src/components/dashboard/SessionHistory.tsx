"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Star,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { getAgentById } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { SessionDetailModal } from "./SessionDetailModal";
import { formatIST } from "@/lib/format-date";
import type { AgentSessionData } from "@/types/session";

const PAGE_SIZE = 10;

export function SessionHistory() {
  const [sessions, setSessions] = useState<AgentSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchPage = useCallback((p: number) => {
    setLoading(true);
    fetch(`/api/sessions?page=${p}&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 animate-pulse">
            <div className="h-4 w-1/3 bg-white/5 rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-[#8888AA]">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No conversations yet. Start chatting with an agent!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session, i) => {
          const agent = getAgentById(session.agentType);
          const transcript =
            (session.transcript as unknown as { text: string }[]) || [];
          return (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedId(session.id)}
              className="w-full glass rounded-xl p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors cursor-pointer group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium text-sm">
                    {session.title || agent?.name || session.agentType}
                  </h4>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        session.status === "completed"
                          ? "rgba(16,185,129,0.1)"
                          : "rgba(0,212,255,0.1)",
                      color:
                        session.status === "completed" ? "#10B981" : "#00D4FF",
                    }}
                  >
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-[#8888AA]">
                  <span>{formatIST(session.createdAt)}</span>
                  {session.duration != null && session.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(session.duration / 60)}m{" "}
                      {session.duration % 60}s
                    </span>
                  )}
                  {transcript.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {transcript.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {session.rating != null && session.rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm">{session.rating}</span>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-[#8888AA] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Prev / Next */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            onClick={() => fetchPage(page - 1)}
            disabled={page <= 1 || loading}
            variant="outline"
            size="sm"
            className="border-[#2A2A3E] text-white disabled:opacity-30 gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <span className="text-xs text-[#8888AA]">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => fetchPage(page + 1)}
            disabled={page >= totalPages || loading}
            variant="outline"
            size="sm"
            className="border-[#2A2A3E] text-white disabled:opacity-30 gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {selectedId && (
        <SessionDetailModal
          sessionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
