import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";
import * as hotelAgent from "@/lib/agents/hotel-agent";
import * as medicalAgent from "@/lib/agents/medical-agent";
import * as interviewAgent from "@/lib/agents/interview-agent";
import * as restaurantAgent from "@/lib/agents/restaurant-agent";
import * as legalAgent from "@/lib/agents/legal-agent";

/**
 * Universal RAG-as-tool. Exposed to every agent (SMB and interview).
 *
 * The system prompt already includes a one-shot RAG retrieval at session
 * start (top-k=10 against a seed query). But mid-call the caller often
 * pivots to a topic the seed didn't surface — at that point the agent can
 * call this tool with a fresh, specific query to pull more relevant
 * snippets from the owner's knowledge base.
 */
export const searchKnowledgeTool: GeminiToolDeclaration = {
  name: "searchKnowledge",
  description:
    "Search the business's uploaded knowledge base (FAQs, policies, documents) for information " +
    "relevant to a specific question that came up in the conversation. " +
    "Use this when the caller asks about a topic that wasn't covered in your initial context, " +
    "or when you need more detail on something specific. Do NOT call it for every turn — " +
    "only when the caller's question requires information you don't already have.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "What you're looking for, phrased as a search query. Be specific. " +
          "Examples: 'cancellation policy for non-refundable bookings', " +
          "'whether the pediatrician sees walk-ins on Saturday', " +
          "'gluten-free options on the dinner menu'.",
      },
    },
    required: ["query"],
  },
};

/**
 * Universal lead-capture tool exposed by all SMB-facing agents (everything
 * except interview). The agent calls this whenever the caller wants to do
 * something transactional — booking, ordering, scheduling — that the agent
 * cannot complete itself. The tool persists the lead and the business owner
 * is notified by email after the call.
 */
export const captureLeadTool: GeminiToolDeclaration = {
  name: "captureLead",
  description:
    "Record the caller's contact details and intent so the business owner can follow up. " +
    "MUST be called any time the caller wants to book, order, schedule, reserve, or otherwise transact — " +
    "you cannot complete those actions yourself.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Caller's name" },
      phone: { type: "string", description: "Caller's phone number, digits only or with + and dashes" },
      email: { type: "string", description: "Caller's email address (optional)" },
      intent: {
        type: "string",
        description:
          "What the caller wants. Be specific. " +
          "Examples: 'book a deluxe room for May 3-5', 'schedule consultation with Dr. Smith next Tuesday morning', " +
          "'order family-size pizza for delivery to 12 Park Lane'",
      },
      urgency: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "How time-sensitive the request is",
      },
      notes: { type: "string", description: "Any additional context, preferences, or constraints mentioned" },
    },
    required: ["intent"],
  },
};

/**
 * Hard rule appended to every SMB agent's system prompt. Phrased so the model
 * treats it as inviolable — booking claims have been the #1 hallucination
 * failure mode in voice agents.
 */
export const leadCaptureRule = `
## CRITICAL: You are an information agent, not a booking agent

You CANNOT book, order, schedule, reserve, modify, or cancel anything yourself.
The pre-call screen and your tools provide INFORMATION about what the business offers — they do not transact.

When the caller wants any of the above:
1. Acknowledge their request clearly.
2. Call the captureLead tool with their name, phone, and a specific intent describing what they want.
3. Tell them: "I've passed your details to the team — they'll call you back shortly to confirm."

NEVER say "your booking is confirmed", "your appointment is scheduled", "your order is placed", or anything implying you completed a transaction. If the caller pushes you to confirm, gently repeat that the team will call them back to finalize.

If you don't have their phone number yet, ask for it before calling captureLead.
`;

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
- If the caller asks about something specific that wasn't in your initial context, call the searchKnowledge tool to pull fresh details from the business's knowledge base — don't guess
- If you cannot help, explain why and suggest alternatives
`;

// Interview agent needs its own base — no brevity constraint; depth is the goal
const interviewBaseInstructions = `You are an AI technical interviewer on the AgentHub platform conducting a real-time voice conversation.

NON-NEGOTIABLE VOICE RULES:
- Wait for the candidate to fully finish speaking. A pause means thinking, not "done." If you hear silence, give them at least a moment before responding.
- NEVER ask the same question twice. Before you speak, scan the conversation history. If a topic has been covered, move forward — never circle back to ask it again.
- One question per turn. Do not stack multiple questions in a single message.
- Acknowledge their answer briefly ("Got it.", "That makes sense.") before pivoting to the next probe.

Core behaviors:
- Conduct the interview in a natural, conversational voice tone
- Probing follow-ups are expected and encouraged — go deep, not wide
- Be encouraging but honest; give substantive feedback after each answer
- Do not rush to the next topic until you have explored the current one adequately
- If the candidate references a specific framework / tool / library you want fresh detail on, call the searchKnowledge tool to pull relevant material from the owner's knowledge base
`;

export function getAgentSystemPrompt(
  agentType: string,
  config: AgentConfig,
  candidateContext?: Record<string, string>,
): string {
  const mod = agentModules[agentType];
  if (!mod) throw new Error(`Unknown agent type: ${agentType}`);
  const base = agentType === "interview" ? interviewBaseInstructions : baseInstructions;
  // Interview agents are a different product (B2C scoring), no lead capture.
  const tail = agentType === "interview" ? "" : leadCaptureRule;
  return `${base}\n\n${mod.getSystemPrompt(config, candidateContext)}${tail}`;
}

/**
 * Returns tool declarations for the given agent type.
 * If enabledTools is non-empty, only tools whose name appears in the list are returned.
 * An empty/undefined enabledTools means all tools are allowed (default).
 */
export function getAgentTools(agentType: string, enabledTools?: string[]): GeminiToolDeclaration[] {
  const mod = agentModules[agentType];
  if (!mod) return [];
  const moduleTools = mod.getTools();
  // Universal tools appended to every agent:
  //   - searchKnowledge: dynamic RAG retrieval mid-call (everyone)
  //   - captureLead:     transactional handoff (SMB agents only)
  const universalTools: GeminiToolDeclaration[] = [searchKnowledgeTool];
  if (agentType !== "interview") universalTools.push(captureLeadTool);

  const all = [...moduleTools, ...universalTools];
  if (!enabledTools || enabledTools.length === 0) return all;
  // The universal tools are non-removable. Owners can disable per-template
  // info tools via enabledTools, but searchKnowledge + captureLead are
  // load-bearing for the agent's correctness.
  return all.filter(
    (t) => t.name === "captureLead" || t.name === "searchKnowledge" || enabledTools.includes(t.name),
  );
}

export function handleAgentToolCall(
  agentType: string,
  name: string,
  args: Record<string, unknown>,
  agentId?: string,
): string {
  // captureLead is universal across SMB agents. Persistence is done by the
  // live-session caller; this just acks back to the model so it can continue.
  if (name === "captureLead") {
    return JSON.stringify({
      captured: true,
      message: "Lead recorded. Tell the caller someone will follow up shortly.",
    });
  }
  const mod = agentModules[agentType];
  if (!mod) return JSON.stringify({ error: "Unknown agent type" });
  return mod.handleToolCall(name, args, agentId);
}
