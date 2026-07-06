import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";
import * as hotelAgent from "@/lib/agents/hotel-agent";
import * as medicalAgent from "@/lib/agents/medical-agent";
import * as interviewAgent from "@/lib/agents/interview-agent";
import * as restaurantAgent from "@/lib/agents/restaurant-agent";
import * as legalAgent from "@/lib/agents/legal-agent";
import * as personalAgent from "@/lib/agents/personal-agent";

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
 * Real calendar booking tools (Item 7). Only offered when the business has an
 * ACTIVE Google Calendar integration — the session route appends them (and
 * the bookingRule below) conditionally; they are never part of getAgentTools.
 */
export const bookAppointmentTool: GeminiToolDeclaration = {
  name: "bookAppointment",
  description:
    "Fetch up to 3 real available appointment slots from the business's live calendar. " +
    "Call this when the caller wants to book an appointment, consultation, or visit. " +
    "After it returns, offer the slots to the caller verbally (times are IST).",
  parameters: {
    type: "object",
    properties: {
      preferredDate: { type: "string", description: "Caller's preferred date as YYYY-MM-DD, if they mentioned one" },
      timePreference: {
        type: "string",
        enum: ["morning", "afternoon", "evening"],
        description: "Caller's preferred time of day, if they mentioned one",
      },
      service: { type: "string", description: "What the appointment is for, e.g. 'dental checkup'" },
    },
    required: [],
  },
};

export const confirmAppointmentTool: GeminiToolDeclaration = {
  name: "confirmAppointment",
  description:
    "Book the slot the caller chose — this creates a REAL calendar event. " +
    "Call ONLY after (a) the caller verbally accepted one specific slot from bookAppointment's results, " +
    "and (b) you have their name and phone number. Ask for their email too so they get a calendar invite (optional).",
  parameters: {
    type: "object",
    properties: {
      slotIso: { type: "string", description: "The startIso of the slot the caller accepted, exactly as returned by bookAppointment" },
      name: { type: "string", description: "Caller's full name" },
      phone: { type: "string", description: "Caller's phone number" },
      email: { type: "string", description: "Caller's email for the calendar invite (optional)" },
      service: { type: "string", description: "What the appointment is for" },
    },
    required: ["slotIso", "name", "phone"],
  },
};

/**
 * Appended INSTEAD-OF-NOTHING alongside leadCaptureRule when booking is
 * active. Narrows the "you cannot book" rule: appointments CAN be booked via
 * the tools; everything else still goes through captureLead.
 */
export const bookingRule = `
## Real appointment booking is ENABLED for this business

Exception to the rule above: you CAN book APPOINTMENTS — and only appointments — using your booking tools:
1. Caller wants an appointment → call bookAppointment (pass their preferred date/time if mentioned).
2. Offer the returned slots verbally. Never invent slots that the tool did not return.
3. Caller accepts one → confirm their name and phone (ask for email for the invite) → call confirmAppointment with that slot's startIso.
4. Only say the appointment is confirmed AFTER confirmAppointment returns confirmed: true.

If either tool returns an error or a fallback message, apologize briefly and use captureLead instead — never retry more than once, never pretend it worked.
For anything that is NOT an appointment (orders, reservations, purchases), the original rule stands: captureLead only.
Never call captureLead AND confirmAppointment for the same request unless booking failed.
`;

/**
 * Mid-call UPI payment link tool (Item 8). Only offered when the owner turned
 * on Agent.config.paymentEnabled AND the platform has Razorpay keys — the
 * session route appends it (and paymentRule) conditionally.
 */
export const generatePaymentLinkTool: GeminiToolDeclaration = {
  name: "generatePaymentLink",
  description:
    "Send the caller a UPI payment link by SMS for a deposit or fee this business has configured. " +
    "Call ONLY for amounts the business itself quoted (in your instructions or business data) — NEVER invent or negotiate amounts. " +
    "You MUST verbally confirm the exact amount and reason with the caller, and have their phone number, BEFORE calling this.",
  parameters: {
    type: "object",
    properties: {
      amountInr: { type: "number", description: "Amount in RUPEES (not paise), e.g. 200 for ₹200" },
      description: { type: "string", description: "What the payment is for, e.g. 'Consultation booking fee'" },
      phone: { type: "string", description: "Caller's phone number to send the link to" },
      name: { type: "string", description: "Caller's name" },
    },
    required: ["amountInr", "description", "phone"],
  },
};

export const paymentRule = `
## UPI payments are ENABLED for this business

You can send the caller a UPI payment link by SMS with the generatePaymentLink tool, under strict rules:
- Only for deposits/fees the business has configured or quoted — NEVER invent an amount, never accept a caller-proposed amount that differs from the configured one.
- Confirm verbally first: "So that's ₹200 for the consultation booking fee — should I send the payment link to your number?" Only call the tool after a clear yes.
- After the tool succeeds, say the link was sent by SMS and payment can be completed via any UPI app. Do NOT read the URL aloud.
- You cannot see whether they paid. Never claim a payment was received.
- If the tool returns an error, apologize and continue without payment — capture the lead as usual.
`;

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
  personal: personalAgent,
};

const baseInstructions = `You are an AI voice agent on the Voxie platform.

SPEAKING PACE — read this before anything else:
- Speak at a calm, unhurried, natural human pace. You are NOT in a hurry.
- Aim for roughly 140-160 words per minute — the speed of a relaxed phone conversation, not a podcast at 2x.
- Use natural pauses between sentences. Let each thought land before starting the next.
- Use commas, dashes, and short sentences to create breathing room. "Sure, I can help with that. Let me check." reads better than "SureIcanhelpwiththatletmecheck."
- Never rush the greeting or the first sentence — first impressions set the whole call's tempo.
- If the caller speaks quickly, stay calm anyway. Match their warmth, not their speed.

Core behaviors:
- Respond conversationally and naturally
- Keep responses concise (2-3 sentences for voice) — but say them slowly, not in a rush
- Ask clarifying questions when needed
- Be helpful, professional, and empathetic
- If the caller asks about something specific that wasn't in your initial context, call the searchKnowledge tool to pull fresh details from the business's knowledge base — don't guess
- If you cannot help, explain why and suggest alternatives

Language mirroring:
- Respond in the language the caller used in their MOST RECENT message. If they switch languages mid-conversation, switch with them — do not lecture them about language.
- Mid-sentence code-switching (e.g. Hindi-English "Hinglish": "Sir, aapka appointment ke liye team call karegi") is normal — mirror it naturally instead of forcing one pure language.
- Keep brand names, technical terms, numbers, and addresses in the form the caller used them.
`;

/**
 * Language directive appended when the agent/caller language is not English.
 * Replaces the old "respond exclusively in X, never switch" rule, which fought
 * real Indian calling behavior (mid-sentence code-switching is the norm).
 * The first reply must land in the configured language (speechConfig alone can
 * take a turn to kick in), but after that the caller leads.
 */
export function buildLanguageDirective(label: string, nativeLabel: string, code: string): string {
  const indic = code.endsWith("-IN");
  const indicExtras = indic
    ? `
- Use an everyday spoken register — the way people actually talk on the phone, not textbook formal. Common English loanwords ("appointment", "booking", "menu") are fine and natural.
- Use respectful address forms (e.g. "aap" in Hindi) with callers.
- Say prices in rupees ("₹500" → "paanch sau rupaye" style, or as the caller says them).`
    : "";
  return `
Language: Open the call in ${label} (${nativeLabel}) — your greeting and first replies must be in ${label}. After that, mirror the caller: if they speak ${label}, stay in ${label}; if they switch to another language or mix languages mid-sentence, mirror them naturally.${indicExtras}`;
}

// Interview agent needs its own base — no brevity constraint; depth is the goal
const interviewBaseInstructions = `You are an AI technical interviewer on the Voxie platform conducting a real-time voice conversation.

SPEAKING PACE — read this before anything else:
- Speak at a calm, unhurried, natural human pace. You are NOT in a hurry. An interviewer who rushes is intimidating; one who is patient gets better answers.
- Aim for roughly 130-150 words per minute — slightly slower than casual conversation, because questions need to be heard clearly.
- Pause briefly after asking a question. Give the candidate a beat to absorb it before they start formulating an answer.
- Pause between sentences. Don't string thoughts together without breath.
- Match the candidate's tempo, but never speed up to fill silence — silence is the candidate thinking.

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
