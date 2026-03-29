"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Star, MessageSquare, Trash2 } from "lucide-react";
import { getAgentById } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import type { AgentSessionData } from "@/types/session";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<AgentSessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = () => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
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
        <div className="space-y-3">
          {sessions.map((session, i) => {
            const agent = getAgentById(session.agentType);
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-5 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3
                        className="font-semibold text-white"
                        style={{ color: agent?.accentColor }}
                      >
                        {agent?.name || session.agentType}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            session.status === "completed" ? "rgba(16,185,129,0.1)" :
                            session.status === "active" ? "rgba(0,212,255,0.1)" :
                            "rgba(239,68,68,0.1)",
                          color:
                            session.status === "completed" ? "#10B981" :
                            session.status === "active" ? "#00D4FF" :
                            "#EF4444",
                        }}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#8888AA]">
                      <span>{new Date(session.createdAt).toLocaleString()}</span>
                      {session.duration != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(session.duration / 60)}m {session.duration % 60}s
                        </span>
                      )}
                      {session.transcript && session.transcript.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {session.transcript.length} messages
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.rating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">{session.rating}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleDelete(session.id)}
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
      )}
    </div>
  );
}
