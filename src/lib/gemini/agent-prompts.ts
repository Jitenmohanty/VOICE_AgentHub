import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";
import * as hotelAgent from "@/lib/agents/hotel-agent";
import * as medicalAgent from "@/lib/agents/medical-agent";
import * as interviewAgent from "@/lib/agents/interview-agent";
import * as restaurantAgent from "@/lib/agents/restaurant-agent";
import * as legalAgent from "@/lib/agents/legal-agent";

const agentModules: Record<
  string,
  {
    getSystemPrompt: (config: AgentConfig, extra?: Record<string, string>) => string;
    getTools: () => GeminiToolDeclaration[];
    handleToolCall: (name: string, args: Record<string, unknown>, agentId?: string) => string;
  }
> = {
  hotel: hotelAgent,
  medical: medicalAgent,
  interview: interviewAgent,
  restaurant: restaurantAgent,
  legal: legalAgent,
};

const baseInstructions = `You are an AI voice agent on the AgentHub platform.
Core behaviors:
- Respond conversationally and naturally
- Keep responses concise (2-3 sentences for voice)
- Ask clarifying questions when needed
- Be helpful, professional, and empathetic
- If you cannot help, explain why and suggest alternatives
`;

// Interview agent needs its own base — no brevity constraint; depth is the goal
const interviewBaseInstructions = `You are an AI technical interviewer on the AgentHub platform.
Core behaviors:
- Conduct the interview in a natural, conversational voice tone
- You MAY ask follow-up or probing questions — this is expected and encouraged
- Be encouraging but honest; give substantive feedback after each answer
- Do not rush to the next topic until you have explored the current one adequately
`;

export function getAgentSystemPrompt(
  agentType: string,
  config: AgentConfig,
  candidateContext?: Record<string, string>,
): string {
  const mod = agentModules[agentType];
  if (!mod) throw new Error(`Unknown agent type: ${agentType}`);
  const base = agentType === "interview" ? interviewBaseInstructions : baseInstructions;
  return `${base}\n\n${mod.getSystemPrompt(config, candidateContext)}`;
}

/**
 * Returns tool declarations for the given agent type.
 * If enabledTools is non-empty, only tools whose name appears in the list are returned.
 * An empty/undefined enabledTools means all tools are allowed (default).
 */
export function getAgentTools(agentType: string, enabledTools?: string[]): GeminiToolDeclaration[] {
  const mod = agentModules[agentType];
  if (!mod) return [];
  const all = mod.getTools();
  if (!enabledTools || enabledTools.length === 0) return all;
  return all.filter((t) => enabledTools.includes(t.name));
}

export function handleAgentToolCall(
  agentType: string,
  name: string,
  args: Record<string, unknown>,
  agentId?: string,
): string {
  const mod = agentModules[agentType];
  if (!mod) return JSON.stringify({ error: "Unknown agent type" });
  return mod.handleToolCall(name, args, agentId);
}
