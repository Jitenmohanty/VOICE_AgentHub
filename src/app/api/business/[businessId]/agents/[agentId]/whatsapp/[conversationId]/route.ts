import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

type Params = { params: Promise<{ businessId: string; agentId: string; conversationId: string }> };

const TAKEOVER_HOURS = 4;

/**
 * PATCH /api/business/[businessId]/agents/[agentId]/whatsapp/[conversationId]
 * Body: { takeover: boolean }
 * takeover=true  → AI stays silent on this thread for 4 hours (human replies from their own WhatsApp)
 * takeover=false → AI resumes immediately
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId, conversationId } = await params;
    const convo = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        agentId,
        businessId,
        business: businessAccessFilter(session.user.id),
      },
      select: { id: true },
    });
    if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as { takeover?: unknown };
    if (typeof body.takeover !== "boolean") {
      return NextResponse.json({ error: "takeover (boolean) is required" }, { status: 400 });
    }

    const updated = await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        humanTakeoverUntil: body.takeover
          ? new Date(Date.now() + TAKEOVER_HOURS * 60 * 60 * 1000)
          : null,
      },
    });

    return NextResponse.json({ conversation: updated });
  } catch (err) {
    console.error("[WhatsApp takeover] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
