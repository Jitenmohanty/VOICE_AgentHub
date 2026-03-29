"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGENTS } from "@/lib/agents";
import { AgentCard } from "./AgentCard";
import { ConfigModal } from "./ConfigModal";
import { useAgentStore } from "@/stores/agent-store";
import type { AgentDefinition, AgentConfig } from "@/types/agent";

export function AgentGrid() {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);
  const setActiveAgent = useAgentStore((s) => s.setActiveAgent);

  const handleStart = (agent: AgentDefinition) => {
    if (agent.configFields.length > 0) {
      setSelectedAgent(agent);
    } else {
      setActiveAgent(agent.id, {});
      router.push(`/agent/${agent.id}`);
    }
  };

  const handleConfigSubmit = (config: AgentConfig) => {
    if (!selectedAgent) return;
    setActiveAgent(selectedAgent.id, config);
    setSelectedAgent(null);
    router.push(`/agent/${selectedAgent.id}`);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS.map((agent, index) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            index={index}
            onStart={handleStart}
          />
        ))}
      </div>

      {selectedAgent && (
        <ConfigModal
          agent={selectedAgent}
          onSubmit={handleConfigSubmit}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </>
  );
}
