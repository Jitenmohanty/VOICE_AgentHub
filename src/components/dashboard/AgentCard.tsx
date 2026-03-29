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
import { Button } from "@/components/ui/button";
import type { AgentDefinition } from "@/types/agent";

const iconMap: Record<string, React.ElementType> = {
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
};

interface AgentCardProps {
  agent: AgentDefinition;
  index: number;
  onStart: (agent: AgentDefinition) => void;
}

export function AgentCard({ agent, index, onStart }: AgentCardProps) {
  const Icon = iconMap[agent.icon] ?? Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="glass rounded-2xl p-6 flex flex-col group transition-all"
      style={{ borderColor: `${agent.accentColor}15` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
          style={{ backgroundColor: `${agent.accentColor}15` }}
        >
          <Icon className="w-7 h-7" style={{ color: agent.accentColor }} />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Available</span>
        </div>
      </div>

      <h3 className="font-(family-name:--font-heading) font-semibold text-lg text-white mb-1">
        {agent.name}
      </h3>
      <p className="text-sm text-[#8888AA] mb-3">{agent.tagline}</p>
      <p className="text-sm text-[#666680] mb-4 flex-1">{agent.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.capabilities.map((cap) => (
          <span
            key={cap}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: `${agent.accentColor}10`,
              color: agent.accentColor,
            }}
          >
            {cap}
          </span>
        ))}
      </div>

      <Button
        onClick={() => onStart(agent)}
        className="w-full mt-auto border-0 text-white hover:opacity-90 transition-all"
        style={{
          background: `linear-gradient(135deg, ${agent.accentColor}, ${agent.accentColor}CC)`,
        }}
      >
        Start Conversation
      </Button>
    </motion.div>
  );
}
