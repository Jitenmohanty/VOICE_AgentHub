import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getAgentSystemPrompt, getAgentTools } from "@/lib/gemini/agent-prompts";
import { queryKnowledge, buildRAGContext, buildBusinessDataContext } from "@/lib/rag";
import { checkSessionRateLimit, checkBusinessPlanQuota } from "@/lib/ratelimit";
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

    // Enforce the business's monthly plan quota (free/starter/pro). Returns
    // 429 + an upgrade hint when month-to-date minutes exceed plan.monthlyMinutes.
    const overQuota = await checkBusinessPlanQuota(business.id);
    if (overQuota) return overQuota;

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

    // For interview agents, inject per-session variety hints so the same
    // candidate + tech stack doesn't get the same questions on every session.
    // Three perturbations: (a) random seed token, (b) randomized "lead-with"
    // topic angle, (c) randomized depth focus.
    if (agent.templateType === "interview") {
      const TOPIC_ANGLES = [
        "real-world debugging stories",
        "trade-offs between competing approaches",
        "scaling and performance under load",
        "edge cases and failure modes",
        "code organization and maintainability",
        "testing strategy and coverage",
        "recent ecosystem changes and best practices",
        "security and data validation concerns",
        "concurrency and race conditions",
        "API design and contracts",
      ] as const;
      const DEPTH_FOCUS = [
        "go especially deep on internals",
        "emphasize practical, day-to-day work",
        "lean into architecture-level thinking",
        "focus on the candidate's most-used libraries",
        "probe for production experience specifically",
      ] as const;
      const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!;
      const angle1 = pick(TOPIC_ANGLES);
      let angle2 = pick(TOPIC_ANGLES);
      while (angle2 === angle1) angle2 = pick(TOPIC_ANGLES);
      const depth = pick(DEPTH_FOCUS);
      const varietySeed = randomBytes(4).toString("hex");

      // Override existing candidateContext with the variety hints appended.
      const ctxBase: Record<string, string> = candidateContext ? { ...candidateContext } : {};
      ctxBase.varietySeed = varietySeed;
      ctxBase.sessionAngles = `${angle1}; ${angle2}`;
      ctxBase.sessionDepthFocus = depth;
      // Reassign so the downstream prompt build uses the enriched context.
      (body as { candidateContext?: Record<string, string> }).candidateContext = ctxBase;
    }
    const enrichedCandidateContext = (body.candidateContext as Record<string, string> | undefined) ?? candidateContext;

    // 1. Build base system prompt
    let systemPrompt: string;
    if (agent.systemPrompt && agent.templateType !== "interview") {
      // Custom system prompt: use as-is for non-interview agents
      systemPrompt = agent.systemPrompt;
    } else if (agent.systemPrompt && agent.templateType === "interview" && enrichedCandidateContext) {
      // Interview agent with custom prompt: still inject candidateContext so the
      // agent knows who it's talking to (name, resume, stack, level, variety hints)
      systemPrompt = getAgentSystemPrompt(agent.templateType, agentConfig, enrichedCandidateContext);
      systemPrompt += `\n\nAdditional Owner Instructions:\n${agent.systemPrompt}`;
    } else {
      systemPrompt = getAgentSystemPrompt(agent.templateType, agentConfig, enrichedCandidateContext);
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
        agent.templateType === "interview" && enrichedCandidateContext?.techStack
          ? `technical interview questions about ${enrichedCandidateContext.techStack}`
          : agent.greeting || `Help with ${agent.name}`;
      const ragResults = await queryKnowledge(agent.id, ragSeed, 10);
      if (ragResults.length > 0) {
        systemPrompt += buildRAGContext(ragResults);
      }
    } catch (ragErr) {
      console.warn("[RAG] Knowledge query failed:", ragErr);
    }

    // Filter tools to only those enabled by the business owner.
    // An empty enabledTools array means "all tools allowed" (default / legacy).
    const tools = getAgentTools(agent.templateType, agent.enabledTools);

    // Per-session bearer token. Required on subsequent PATCH so anonymous
    // callers can't overwrite each other's transcripts using only the cuid.
    const updateToken = randomBytes(32).toString("hex");

    // Create anonymous session
    const agentSession = await prisma.agentSession.create({
      data: {
        agentId: agent.id,
        title: `${agent.name} Session`,
        callerName: body.callerName || enrichedCandidateContext?.name || null,
        callerPhone: body.callerPhone || null,
        status: "active",
        updateToken,
      },
    });

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    return NextResponse.json({
      apiKey,
      sessionId: agentSession.id,
      updateToken,
      agentId: agent.id,
      systemPrompt,
      tools,
      voiceName: agent.voiceName || null,
      language: agent.language || "en",
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
