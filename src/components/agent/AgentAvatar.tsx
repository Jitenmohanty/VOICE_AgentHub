"use client";

import { motion } from "framer-motion";
import {
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
  User,
  Sparkles,
} from "lucide-react";
import type { ConnectionState } from "@/types/gemini";

const iconMap: Record<string, React.ElementType> = {
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
  User,
};

interface AgentAvatarProps {
  icon: string;
  accentColor: string;
  connectionState: ConnectionState;
  isSpeaking: boolean;
}

/**
 * Agent avatar — refined for the WisprType aesthetic. The outer rings now use
 * soft white at low opacity (so they read as "presence" rather than "loud
 * accent") while the inner orb keeps the per-agent accentColor as a tinted
 * inner gradient. Speaking and connecting states drive subtle scale +
 * opacity pulses instead of bright accent flashes.
 */
export function AgentAvatar({ icon, accentColor, connectionState, isSpeaking }: AgentAvatarProps) {
  const Icon = iconMap[icon] ?? Sparkles;
  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse — subtle white ring while speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute rounded-full border border-white/20"
          style={{ width: 180, height: 180 }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Soft halo glow — uses brand gradient when connected */}
      {isConnected && (
        <div
          className="absolute rounded-full blur-2xl pointer-events-none"
          style={{
            width: 180,
            height: 180,
            background: `radial-gradient(circle, ${accentColor}55, transparent 70%)`,
            opacity: isSpeaking ? 0.9 : 0.5,
            transition: "opacity 0.4s ease-out",
          }}
        />
      )}

      {/* Mid ring */}
      {isConnected && (
        <motion.div
          className="absolute rounded-full border border-white/10"
          style={{
            width: 144,
            height: 144,
            background: "rgba(255, 255, 255, 0.03)",
          }}
          animate={isSpeaking ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}

      {/* Main orb */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full backdrop-blur-xl"
        style={{
          width: 112,
          height: 112,
          background: `radial-gradient(circle at 30% 30%, ${accentColor}40, ${accentColor}08 70%), var(--ah-bg-raised, rgba(11, 16, 32, 0.7))`,
          border: `1px solid ${accentColor}30`,
          boxShadow: isConnected
            ? `0 8px 32px -8px ${accentColor}66, inset 0 1px 0 rgba(255,255,255,0.1)`
            : `inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
        animate={
          isConnecting
            ? { scale: [1, 1.04, 1] }
            : isSpeaking
              ? { scale: [1, 1.06, 1] }
              : {}
        }
        transition={{ duration: isConnecting ? 1.2 : 0.7, repeat: Infinity }}
      >
        <Icon className="w-10 h-10" style={{ color: accentColor }} strokeWidth={1.75} />
      </motion.div>

      {/* Status dot */}
      <div
        className={`absolute bottom-1 right-1 z-20 w-4 h-4 rounded-full border-2 border-[var(--ah-bg-deep)] ${
          connectionState === "connected"
            ? "bg-gradient-to-br from-emerald-400 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            : connectionState === "connecting"
              ? "bg-gradient-to-br from-amber-400 to-amber-300"
              : connectionState === "error"
                ? "bg-gradient-to-br from-rose-500 to-rose-400"
                : "bg-white/25"
        }`}
      />
    </div>
  );
}
