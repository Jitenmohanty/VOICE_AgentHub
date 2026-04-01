import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAgentSystemPrompt, getAgentTools } from "@/lib/gemini/agent-prompts";
import { queryKnowledge, buildRAGContext, buildBusinessDataContext } from "@/lib/rag";

/** POST — create anonymous session + return API key with RAG-enhanced prompt. No auth. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        agents: {
          where: { isActive: true },
          take: 1,
          include: {
            businessData: true,
          },
        },
      },
    });

    if (!business || !business.isActive || business.agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const agent = business.agents[0]!;
    const agentConfig = (agent.config as Record<string, string | string[]>) || {};

    // Parse body first so candidateContext is available for system prompt building
    const body = await request.json().catch(() => ({}));
    const candidateContext = (body.candidateContext as Record<string, string>) || undefined;
    const callContext = (body.callContext as string) || undefined;

    // 1. Build base system prompt
    let systemPrompt: string;
    if (agent.systemPrompt) {
      systemPrompt = agent.systemPrompt;
    } else {
      systemPrompt = getAgentSystemPrompt(agent.templateType, agentConfig, candidateContext);
    }

    // Inject caller's pre-call context (e.g., "ordering food" or "book appointment with Dr. Smith")
    if (callContext) {
      systemPrompt += `\n\nCaller Context: The caller selected "${callContext}" before starting the call. Address this intent immediately.`;
    }

    // 2. Inject personality and rules
    if (agent.personality) {
      systemPrompt += `\n\nPersonality & Tone: ${agent.personality}`;
    }
    if (agent.rules) {
      systemPrompt += `\n\nCustom Rules:\n${agent.rules}`;
    }

    // 3. Inject business context
    systemPrompt += `\n\nBusiness: ${business.name}`;
    if (business.description) {
      systemPrompt += `\nAbout: ${business.description}`;
    }
    if (business.phone) {
      systemPrompt += `\nPhone: ${business.phone}`;
    }
    if (business.address) {
      systemPrompt += `\nAddress: ${business.address}`;
    }

    // 4. Inject structured business data (rooms, menu, services, etc.)
    if (agent.businessData.length > 0) {
      systemPrompt += buildBusinessDataContext(agent.businessData);
    }

    // 5. RAG: query knowledge base with a broad greeting-based query
    try {
      const greeting = agent.greeting || `Help with ${agent.name}`;
      const ragResults = await queryKnowledge(agent.id, greeting, 10);
      if (ragResults.length > 0) {
        systemPrompt += buildRAGContext(ragResults);
      }
    } catch (ragErr) {
      console.warn("[RAG] Knowledge query failed:", ragErr);
    }

    const tools = getAgentTools(agent.templateType);

    // Create anonymous session
    const agentSession = await prisma.agentSession.create({
      data: {
        agentId: agent.id,
        title: `${agent.name} Session`,
        callerName: body.callerName || candidateContext?.name || null,
        callerPhone: body.callerPhone || null,
        status: "active",
      },
    });

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    return NextResponse.json({
      apiKey,
      sessionId: agentSession.id,
      agentId: agent.id,
      systemPrompt,
      tools,
      agent: {
        id: agent.id,
        name: agent.name,
        templateType: agent.templateType,
        greeting: agent.greeting,
        config: agent.config,
      },
    });
  } catch (error) {
    console.error("[API] public session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
