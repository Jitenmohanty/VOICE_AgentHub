"use client";

import { motion } from "framer-motion";

export function CardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.06] mb-4" />
      <div className="h-5 w-2/3 bg-white/[0.06] rounded mb-2" />
      <div className="h-4 w-1/2 bg-white/[0.06] rounded mb-4" />
      <div className="h-16 w-full bg-white/[0.06] rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-white/[0.06] rounded-full" />
        <div className="h-6 w-20 bg-white/[0.06] rounded-full" />
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

/**
 * Premium connection loader — three concentric rings tinted with the brand
 * gradient + a soft pulsing core. Used during call setup so the caller has
 * something elegant to look at instead of a bare spinner.
 */
export function ConnectionLoader({ agentName }: { agentName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-5"
    >
      <div className="relative w-24 h-24">
        {/* Outer ring — pings */}
        <div className="absolute inset-0 rounded-full border border-violet-300/30 animate-ping" />
        {/* Mid ring — gradient soft glow */}
        <div className="absolute inset-2 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_70%)] animate-pulse" />
        {/* Core */}
        <div className="absolute inset-5 rounded-full ah-gradient-bg shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-white/60">Connecting to {agentName}…</p>
    </motion.div>
  );
}
