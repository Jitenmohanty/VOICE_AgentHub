import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

async function verifyAgent(userId: string, businessId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, businessId, business: businessAccessFilter(userId) },
    select: { id: true },
  });
}

/**
 * GET /api/business/[businessId]/agents/[agentId]/knowledge/gaps
 * Owner/member. Open knowledge gaps (caller questions the agent couldn't
 * answer), most-asked first. Feeds the "Callers asked, no answer" card.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    if (!(await verifyAgent(session.user.id, businessId, agentId))) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const gaps = await prisma.knowledgeGap.findMany({
      where: { agentId, status: "open" },
      orderBy: [{ hits: "desc" }, { lastAskedAt: "desc" }],
      take: 20,
    });

    return NextResponse.json({ gaps });
  } catch (err) {
    console.error("[KnowledgeGaps] GET failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const PatchSchema = z.object({
  gapId: z.string().cuid(),
  status: z.enum(["dismissed", "resolved"]),
});

/**
 * PATCH — mark a gap dismissed (not relevant) or resolved (owner added an
 * answer for it). The knowledge page calls this after the owner acts.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    if (!(await verifyAgent(session.user.id, businessId, agentId))) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const parse = PatchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: "gapId and a valid status are required" }, { status: 400 });
    }

    // updateMany so a gapId from another agent can't be mutated cross-tenant.
    const result = await prisma.knowledgeGap.updateMany({
      where: { id: parse.data.gapId, agentId },
      data: { status: parse.data.status },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Gap not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[KnowledgeGaps] PATCH failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
