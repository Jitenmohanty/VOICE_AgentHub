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

export function getAgentSystemPrompt(
  agentType: string,
  config: AgentConfig,
  candidateContext?: Record<string, string>,
): string {
  const mod = agentModules[agentType];
  if (!mod) throw new Error(`Unknown agent type: ${agentType}`);
  return `${baseInstructions}\n\n${mod.getSystemPrompt(config, candidateContext)}`;
}

export function getAgentTools(agentType: string): GeminiToolDeclaration[] {
  const mod = agentModules[agentType];
  if (!mod) return [];
  return mod.getTools();
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
