import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAgentSystemPrompt, getAgentTools } from "@/lib/gemini/agent-prompts";
import { queryKnowledge, buildRAGContext, buildBusinessDataContext } from "@/lib/rag";
import { checkSessionRateLimit } from "@/lib/ratelimit";
import { SessionCreateSchema } from "@/lib/schemas";

/** POST — create anonymous session + return API key with RAG-enhanced prompt. No auth. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Rate limit: 10 sessions/IP/min, 60 sessions/slug/hour
    const limited = await checkSessionRateLimit(request, slug);
    if (limited) return limited;

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

    // Validate and parse request body
    const rawBody = await request.json().catch(() => ({}));
    const parse = SessionCreateSchema.safeParse(rawBody);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 },
      );
    }
    const body = parse.data;
    const candidateContext = body.candidateContext as Record<string, string> | undefined;
    const callContext = body.callContext;

    // 1. Build base system prompt
    let systemPrompt: string;
    if (agent.systemPrompt && agent.templateType !== "interview") {
      // Custom system prompt: use as-is for non-interview agents
      systemPrompt = agent.systemPrompt;
    } else if (agent.systemPrompt && agent.templateType === "interview" && candidateContext) {
      // Interview agent with custom prompt: still inject candidateContext so the
      // agent knows who it's talking to (name, resume, stack, level)
      systemPrompt = getAgentSystemPrompt(agent.templateType, agentConfig, candidateContext);
      systemPrompt += `\n\nAdditional Owner Instructions:\n${agent.systemPrompt}`;
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

    // 5. RAG: query knowledge base with a relevant seed query
    try {
      // For interview agents, seed with the candidate's tech stack for better knowledge retrieval.
      // For all others, use the agent greeting as a broad topic signal.
      const ragSeed =
        agent.templateType === "interview" && candidateContext?.techStack
          ? `technical interview questions about ${candidateContext.techStack}`
          : agent.greeting || `Help with ${agent.name}`;
      const ragResults = await queryKnowledge(agent.id, ragSeed, 10);
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
