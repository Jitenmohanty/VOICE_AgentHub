"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlBarProps {
  isMuted: boolean;
  elapsedSeconds: number;
  isConnected: boolean;
  accentColor: string;
  onToggleMute: () => void;
  onEndCall: () => void;
  onSettings?: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ControlBar({
  isMuted,
  elapsedSeconds,
  isConnected,
  accentColor,
  onToggleMute,
  onEndCall,
  onSettings,
}: ControlBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-4"
    >
      {/* Timer */}
      <div className="flex items-center gap-1.5 text-[#8888AA] text-sm font-(family-name:--font-mono)">
        <Clock className="w-4 h-4" />
        {formatTime(elapsedSeconds)}
      </div>

      {/* Mute button */}
      <Button
        onClick={onToggleMute}
        disabled={!isConnected}
        variant="outline"
        size="icon"
        className={`w-12 h-12 rounded-full border-[#2A2A3E] ${
          isMuted
            ? "bg-red-500/10 text-red-400 border-red-500/30"
            : "bg-white/5 text-white"
        }`}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>

      {/* End call */}
      <Button
        onClick={onEndCall}
        disabled={!isConnected}
        size="icon"
        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-0"
      >
        <PhoneOff className="w-6 h-6" />
      </Button>

      {/* Settings */}
      {onSettings && (
        <Button
          onClick={onSettings}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full bg-white/5 text-white border-[#2A2A3E]"
        >
          <Settings className="w-5 h-5" />
        </Button>
      )}
    </motion.div>
  );
}
