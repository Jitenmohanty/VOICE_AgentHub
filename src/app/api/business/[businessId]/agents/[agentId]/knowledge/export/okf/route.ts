import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";
import {
  serializeAgentKnowledge,
  serializeBusinessData,
  serializeAgentCard,
  type OkfKnowledgeInput,
  type OkfBusinessDataInput,
} from "@/lib/okf";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

/**
 * GET /api/business/[businessId]/agents/[agentId]/knowledge/export/okf
 *
 * Owner/member. Serializes the agent's knowledge base into an OKF bundle
 * (Phase 1 — READ ONLY: no writes, no side effects). Returns the bundle as a
 * JSON `{ files: { "<path>.md": "<contents>" } }` map — the dependency-free
 * transport chosen in OKF_INTEGRATION_PLAN.md. The client saves it as a
 * `.okf.json` file, re-importable in Phase 2.
 *
 * Only knowledge concepts are serialized — never leads/users/PII (the
 * serializer has no code path to that data; see okf.test.ts).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, businessId, business: businessAccessFilter(session.user.id) },
      select: {
        id: true,
        name: true,
        templateType: true,
        greeting: true,
        personality: true,
        systemPrompt: true,
        voiceName: true,
        language: true,
        enabledTools: true,
        business: { select: { slug: true } },
      },
    });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const [items, businessData] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where: { agentId },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          sourceType: true,
          metadata: true,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.businessData.findMany({
        where: { agentId },
        select: { id: true, dataType: true, data: true },
        orderBy: { dataType: "asc" },
      }),
    ]);

    const files: Record<string, string> = {
      ...serializeAgentKnowledge(
        { name: agent.name, slug: agent.business.slug, templateType: agent.templateType },
        items as OkfKnowledgeInput[],
        new Date().toISOString(),
      ),
      ...serializeBusinessData(businessData as OkfBusinessDataInput[]),
      ...serializeAgentCard({
        name: agent.name,
        templateType: agent.templateType,
        greeting: agent.greeting,
        personality: agent.personality,
        systemPrompt: agent.systemPrompt,
        voiceName: agent.voiceName,
        language: agent.language,
        enabledTools: agent.enabledTools,
      }),
    };

    return NextResponse.json({
      files,
      filename: `${agent.business.slug || agentId}-okf-bundle.json`,
      count: items.length + businessData.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
