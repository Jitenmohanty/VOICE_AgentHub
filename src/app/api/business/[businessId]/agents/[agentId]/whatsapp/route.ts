import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

/**
 * GET /api/business/[businessId]/agents/[agentId]/whatsapp
 * Owner or team member. Lists the agent's WhatsApp conversations,
 * most recent inbound first, full thread included (threads are capped
 * at 60 messages on write so this stays bounded).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, businessId, business: businessAccessFilter(session.user.id) },
      select: { id: true },
    });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const conversations = await prisma.whatsAppConversation.findMany({
      where: { agentId },
      orderBy: { lastInboundAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[WhatsApp conversations] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
