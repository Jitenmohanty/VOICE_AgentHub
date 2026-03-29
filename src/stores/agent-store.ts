import { create } from "zustand";
import type { AgentConfig } from "@/types/agent";

interface AgentStore {
  activeAgentId: string | null;
  config: AgentConfig;
  setActiveAgent: (id: string, config: AgentConfig) => void;
  clearAgent: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  activeAgentId: null,
  config: {},
  setActiveAgent: (id, config) => set({ activeAgentId: id, config }),
  clearAgent: () => set({ activeAgentId: null, config: {} }),
}));
