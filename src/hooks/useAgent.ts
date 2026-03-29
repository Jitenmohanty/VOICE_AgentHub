"use client";

import { useAgentStore } from "@/stores/agent-store";
import { getAgentById } from "@/lib/agents";

export function useAgent() {
  const { activeAgentId, config, setActiveAgent, clearAgent } = useAgentStore();
  const agentDef = activeAgentId ? getAgentById(activeAgentId) : null;

  return {
    activeAgentId,
    agentDefinition: agentDef,
    config,
    setActiveAgent,
    clearAgent,
  };
}
