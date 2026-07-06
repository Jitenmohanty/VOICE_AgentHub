import { randomBytes } from "node:crypto";
import type { Content, Part } from "@google/genai";
import { traceable } from "langsmith/traceable";
import { prisma } from "@/lib/db";
import { createGeminiClient } from "@/lib/gemini/client";
import { getAgentSystemPrompt, getAgentTools, buildLanguageDirective } from "@/lib/gemini/agent-prompts";
import { queryKnowledge, buildRAGContext, buildBusinessDataContext } from "@/lib/rag";
import { getLanguage, normalizeLanguage } from "@/lib/languages";
import { triggerPostCallAnalysis } from "@/lib/post-call";
import { sendWhatsAppText } from "@/lib/whatsapp/index";
import type { AgentConfig } from "@/types/agent";

/**
 * WhatsApp inbound text agent (ROADMAP_NEXT.md Item 5).
 *
 * The same agent brain that answers voice calls, re-hosted on Gemini text
 * mode: identical system-prompt assembly (template prompt + personality +
 * business data + one-shot RAG + leadCaptureRule) and the same two universal
 * tools. searchKnowledge executes server-side against pgvector; captureLead
 * creates a real AgentSession and hands it to the EXISTING post-call pipeline
 * (Claude scoring → lead email → signed webhook → WhatsApp confirmation), so
 * a WhatsApp lead is indistinguishable from a voice lead downstream.
 */

const TEXT_MODEL = "gemini-2.5-flash";
const MAX_CONTEXT_MESSAGES = 30; // sent to the model
const MAX_STORED_MESSAGES = 60; // kept on the conversation row
const MAX_TOOL_HOPS = 3;

export interface WhatsAppChatMessage {
  role: "user" | "agent";
  text: string;
  at: string; // ISO timestamp
}

const whatsappChannelRule = `
## Channel: WhatsApp text chat
This is a TEXT conversation on WhatsApp, not a voice call. Adapt:
- Keep replies SHORT — 1-3 sentences. No long paragraphs.
- Plain text only: no markdown headers or bullet lists (a simple dash list is fine), at most one emoji when it fits naturally.
- The voice-pacing instructions above do not apply here; brevity does.
- The caller may reply hours later — re-read the history before answering.
`;

/** Resolve which business + agent should answer a message sent to `destination`. */
export async function resolveWhatsAppTarget(destination: string | null) {
  const enabled = await prisma.business.findMany({
    where: { whatsappEnabled: true, isActive: true },
    include: {
      agents: {
        where: { isActive: true, NOT: { templateType: "interview" } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  if (enabled.length === 0) return null;

  // Prefer an exact per-business sender-number match, fall back to the single
  // enabled business (the common single-tenant BSP setup). Ambiguous = drop.
  const digits = destination?.replace(/\D/g, "") || "";
  const byNumber = enabled.filter(
    (b) => b.whatsappFromNumber && b.whatsappFromNumber.replace(/\D/g, "") === digits,
  );
  const business = byNumber[0] ?? (enabled.length === 1 ? enabled[0] : undefined);
  if (!business || business.agents.length === 0) return null;
  return { business, agent: business.agents[0]! };
}

/** Build the full system prompt for a WhatsApp thread (mirrors the voice session route). */
async function buildWhatsAppSystemPrompt(
  agent: { id: string; templateType: string; config: unknown; systemPrompt: string | null; personality: string | null; rules: string | null; language: string; greeting: string | null; name: string },
  business: { name: string; description: string | null; phone: string | null; address: string | null },
  seedQuery: string,
): Promise<string> {
  const agentConfig = (agent.config ?? {}) as AgentConfig;

  let prompt =
    agent.systemPrompt && agent.templateType !== "interview"
      ? agent.systemPrompt
      : getAgentSystemPrompt(agent.templateType, agentConfig);

  prompt += whatsappChannelRule;

  if (agent.personality) prompt += `\n\nPersonality & Tone: ${agent.personality}`;
  if (agent.rules) prompt += `\n\nRules:\n${agent.rules}`;

  prompt += `\n\nBusiness: ${business.name}${business.description ? ` — ${business.description}` : ""}${business.phone ? `\nPhone: ${business.phone}` : ""}${business.address ? `\nAddress: ${business.address}` : ""}`;

  // Structured data + one-shot RAG, seeded by the caller's actual message —
  // better seed than the greeting since we HAVE their question already.
  const [businessData, rag] = await Promise.all([
    prisma.businessData.findMany({ where: { agentId: agent.id }, select: { dataType: true, data: true } }),
    queryKnowledge(agent.id, seedQuery || agent.greeting || agent.name, 6).catch(() => []),
  ]);
  prompt += buildBusinessDataContext(businessData);
  prompt += buildRAGContext(rag);

  const lang = getLanguage(normalizeLanguage(agent.language));
  if (lang.code !== "en-US") {
    prompt += `\n${buildLanguageDirective(lang.label, lang.nativeLabel, lang.code)}`;
  }
  return prompt;
}

/** Create an AgentSession from a WhatsApp thread so the normal lead pipeline runs. */
async function createSessionFromThread(
  agentId: string,
  fromNumber: string,
  messages: WhatsAppChatMessage[],
  lead: Record<string, unknown>,
): Promise<string> {
  const transcript = messages.map((m, i) => ({
    id: `wa-${i}`,
    speaker: m.role === "user" ? "user" : "agent",
    text: m.text,
    timestamp: m.at,
  }));
  const session = await prisma.agentSession.create({
    data: {
      agentId,
      title: "WhatsApp conversation",
      status: "completed",
      transcript: JSON.parse(JSON.stringify(transcript)),
      duration: 0,
      updateToken: randomBytes(32).toString("hex"),
      capturedLead: JSON.parse(JSON.stringify({ ...lead, capturedAt: new Date().toISOString(), channel: "whatsapp" })),
      callerName: typeof lead.name === "string" ? lead.name : null,
      callerPhone: typeof lead.phone === "string" ? lead.phone : `+${fromNumber}`,
      callerEmail: typeof lead.email === "string" ? lead.email : null,
    },
  });
  return session.id;
}

/**
 * Handle one inbound WhatsApp text message end-to-end:
 * persist it, decide whether the AI may reply (human-takeover gate), run the
 * Gemini tool loop, persist + send the reply. Returns what happened so the
 * webhook route can log it.
 */
export const handleInboundWhatsAppMessage = traceable(
  async function handleInboundWhatsAppMessage(opts: {
    from: string; // caller digits with country code
    text: string;
    destination: string | null; // our BSP number the message was sent to
  }): Promise<{ handled: boolean; replied: boolean; reason?: string }> {
    const target = await resolveWhatsAppTarget(opts.destination);
    if (!target) return { handled: false, replied: false, reason: "no whatsapp-enabled business/agent" };
    const { business, agent } = target;

    const now = new Date();
    const userMsg: WhatsAppChatMessage = { role: "user", text: opts.text.slice(0, 2000), at: now.toISOString() };

    let convo = await prisma.whatsAppConversation.findUnique({
      where: { businessId_fromNumber: { businessId: business.id, fromNumber: opts.from } },
    });
    const history: WhatsAppChatMessage[] = convo ? (convo.messages as unknown as WhatsAppChatMessage[]) : [];
    const stored = [...history, userMsg].slice(-MAX_STORED_MESSAGES);

    convo = convo
      ? await prisma.whatsAppConversation.update({
          where: { id: convo.id },
          data: { messages: JSON.parse(JSON.stringify(stored)), lastInboundAt: now },
        })
      : await prisma.whatsAppConversation.create({
          data: {
            businessId: business.id,
            agentId: agent.id,
            fromNumber: opts.from,
            messages: JSON.parse(JSON.stringify(stored)),
            lastInboundAt: now,
          },
        });

    // Human takeover: store the message but stay silent.
    if (convo.humanTakeoverUntil && convo.humanTakeoverUntil > now) {
      return { handled: true, replied: false, reason: "human takeover active" };
    }

    const systemPrompt = await buildWhatsAppSystemPrompt(agent, business, opts.text);
    const tools = getAgentTools(agent.templateType, (agent.enabledTools as string[]) ?? []);

    // Rebuild Gemini history from the stored thread (context-capped).
    const contents: Content[] = stored.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const gemini = createGeminiClient();
    let replyText = "";
    let capturedLead: Record<string, unknown> | null = null;

    let loopContents = contents;
    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
      const res = await gemini.models.generateContent({
        model: TEXT_MODEL,
        contents: loopContents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: tools as never }],
          temperature: 0.7,
        },
      });
      const parts: Part[] = res.candidates?.[0]?.content?.parts ?? [];
      const fnCalls = parts.filter((p) => p.functionCall);
      if (fnCalls.length === 0) {
        replyText = parts.map((p) => p.text ?? "").join(" ").trim();
        break;
      }
      const responses: Part[] = [];
      for (const p of fnCalls) {
        const name = p.functionCall!.name ?? "";
        const args = (p.functionCall!.args ?? {}) as Record<string, unknown>;
        let result: unknown;
        if (name === "captureLead") {
          capturedLead = args;
          result = { captured: true, message: "Lead recorded. Tell the caller the team will follow up shortly. Do not claim anything is booked." };
        } else if (name === "searchKnowledge") {
          const hits = await queryKnowledge(agent.id, String(args.query ?? ""), 5).catch(() => []);
          result = { results: hits.map((h) => ({ title: h.title, content: h.content.slice(0, 600) })) };
        } else {
          // Template info tools: answer from BusinessData directly.
          const data = await prisma.businessData.findMany({ where: { agentId: agent.id }, select: { dataType: true, data: true } });
          result = data.length > 0 ? { data } : { message: "No data on file — the team will share details on follow-up." };
        }
        responses.push({ functionResponse: { id: p.functionCall!.id, name, response: result as Record<string, unknown> } });
      }
      loopContents = [...loopContents, { role: "model", parts }, { role: "user", parts: responses }];
    }

    if (!replyText) {
      replyText = "Thanks for your message! The team will get back to you shortly.";
    }

    // Persist agent reply (+ lead) BEFORE sending, so a BSP failure never loses state.
    const agentMsg: WhatsAppChatMessage = { role: "agent", text: replyText, at: new Date().toISOString() };
    const finalMessages = [...stored, agentMsg].slice(-MAX_STORED_MESSAGES);

    let sessionId = convo.sessionId;
    if (capturedLead && !convo.sessionId) {
      // First lead in this thread → real AgentSession → full existing pipeline.
      sessionId = await createSessionFromThread(agent.id, opts.from, finalMessages, capturedLead);
      triggerPostCallAnalysis(sessionId);
    }

    await prisma.whatsAppConversation.update({
      where: { id: convo.id },
      data: {
        messages: JSON.parse(JSON.stringify(finalMessages)),
        ...(capturedLead ? { capturedLead: JSON.parse(JSON.stringify(capturedLead)) } : {}),
        ...(sessionId ? { sessionId } : {}),
      },
    });

    const sent = await sendWhatsAppText({ to: opts.from, text: replyText, from: business.whatsappFromNumber });
    if (!sent.ok) console.error(`[WhatsApp] reply send failed for ${convo.id}:`, sent.error);

    return { handled: true, replied: sent.ok };
  },
  { name: "handleInboundWhatsAppMessage", run_type: "chain" },
);
