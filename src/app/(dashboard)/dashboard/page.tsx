"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { AgentGrid } from "@/components/dashboard/AgentGrid";
import { SessionHistory } from "@/components/dashboard/SessionHistory";
import { UserStats } from "@/components/dashboard/UserStats";
import type { AgentSessionData } from "@/types/session";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<AgentSessionData[]>([]);

  useEffect(() => {
    // Fetch up to 50 for stats calculation
    fetch("/api/sessions?page=1&limit=50")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});
  }, []);

  const totalSessions = sessions.length;
  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60,
  );
  const ratedSessions = sessions.filter(
    (s) => s.rating != null && s.rating > 0,
  );
  const avgRating =
    ratedSessions.length > 0
      ? ratedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) /
        ratedSessions.length
      : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-[#8888AA] mt-1">
          Choose an AI agent to start a voice conversation
        </p>
      </motion.div>

      <UserStats
        totalSessions={totalSessions}
        totalMinutes={totalMinutes}
        avgRating={avgRating}
        agentsUsed={new Set(sessions.map((s) => s.agentType)).size}
      />

      <div>
        <h2 className="font-(family-name:--font-heading) text-xl font-semibold text-white mb-4">
          AI Agents
        </h2>
        <AgentGrid />
      </div>

      <div>
        <h2 className="font-(family-name:--font-heading) text-xl font-semibold text-white mb-4">
          Recent Sessions
        </h2>
        <SessionHistory />
      </div>
    </div>
  );
}
