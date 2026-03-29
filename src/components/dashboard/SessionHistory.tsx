"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Star, MessageSquare } from "lucide-react";
import { getAgentById } from "@/lib/agents";
import type { AgentSessionData } from "@/types/session";

export function SessionHistory() {
  const [sessions, setSessions] = useState<AgentSessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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
    <div className="space-y-3">
      {sessions.map((session, i) => {
        const agent = getAgentById(session.agentType);
        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <h4 className="text-white font-medium text-sm">
                {agent?.name || session.agentType}
              </h4>
              <div className="flex items-center gap-4 mt-1 text-xs text-[#8888AA]">
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                {session.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(session.duration / 60)}m {session.duration % 60}s
                  </span>
                )}
              </div>
            </div>
            {session.rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm">{session.rating}</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
