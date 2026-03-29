"use client";

import { motion } from "framer-motion";
import {
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
  Sparkles,
} from "lucide-react";
import type { ConnectionState } from "@/types/gemini";

const iconMap: Record<string, React.ElementType> = {
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
};

interface AgentAvatarProps {
  icon: string;
  accentColor: string;
  connectionState: ConnectionState;
  isSpeaking: boolean;
}

export function AgentAvatar({ icon, accentColor, connectionState, isSpeaking }: AgentAvatarProps) {
  const Icon = iconMap[icon] ?? Sparkles;

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring */}
      {isSpeaking && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            border: `2px solid ${accentColor}`,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Mid ring */}
      {isConnected && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 130,
            height: 130,
            backgroundColor: `${accentColor}10`,
            border: `1px solid ${accentColor}30`,
          }}
          animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {/* Main circle */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 100,
          height: 100,
          background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
          border: `2px solid ${accentColor}40`,
        }}
        animate={
          isConnecting
            ? { scale: [1, 1.05, 1] }
            : isSpeaking
            ? { scale: [1, 1.08, 1] }
            : {}
        }
        transition={{ duration: isConnecting ? 1.2 : 0.6, repeat: Infinity }}
      >
        <Icon className="w-10 h-10" style={{ color: accentColor }} />
      </motion.div>

      {/* Status dot */}
      <div
        className="absolute bottom-0 right-0 z-20 w-5 h-5 rounded-full border-2 border-[#0A0A0F]"
        style={{
          backgroundColor:
            connectionState === "connected"
              ? "#10B981"
              : connectionState === "connecting"
              ? "#FFB800"
              : connectionState === "error"
              ? "#EF4444"
              : "#8888AA",
        }}
      />
    </div>
  );
}
