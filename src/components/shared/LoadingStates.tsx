"use client";

import { motion } from "framer-motion";

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-white/5 mb-4" />
      <div className="h-5 w-2/3 bg-white/5 rounded mb-2" />
      <div className="h-4 w-1/2 bg-white/5 rounded mb-4" />
      <div className="h-16 w-full bg-white/5 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-white/5 rounded-full" />
        <div className="h-6 w-20 bg-white/5 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ConnectionLoader({ agentName }: { agentName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-[#00D4FF]/50 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-[#00D4FF]/20 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#00D4FF] animate-pulse" />
        </div>
      </div>
      <p className="text-[#8888AA] text-sm">Connecting to {agentName}...</p>
    </motion.div>
  );
}
