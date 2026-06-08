"use client";

import { motion } from "framer-motion";
import { MessageSquare, Clock, Star, Zap } from "lucide-react";

interface UserStatsProps {
  totalSessions: number;
  totalMinutes: number;
  avgRating: number;
  agentsUsed?: number;
}

export function UserStats({ totalSessions, totalMinutes, avgRating, agentsUsed = 0 }: UserStatsProps) {
  const stats = [
    { icon: MessageSquare, label: "Sessions", value: totalSessions, color: "#7C3AED" },
    { icon: Clock, label: "Minutes", value: totalMinutes, color: "#06B6D4" },
    { icon: Star, label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "–", color: "#3B82F6" },
    { icon: Zap, label: "Agents Used", value: agentsUsed, color: "#10B981" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass rounded-xl p-4 text-center"
        >
          <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
          <p className="text-2xl font-bold text-white">{stat.value}</p>
          <p className="text-xs text-white/55">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
