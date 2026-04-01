import type { AgentDefinition } from "@/types/agent";
import { TEMPLATES } from "@/lib/templates";

// Derive AGENTS from TEMPLATES to keep config fields in sync
export const AGENTS: AgentDefinition[] = TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  tagline: t.tagline,
  description: t.description,
  icon: t.icon,
  accentColor: t.accentColor,
  capabilities: t.capabilities,
  configFields: t.configFields,
}));

export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.id === id);
}
