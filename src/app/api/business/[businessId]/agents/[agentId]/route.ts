import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

async function verifyOwnership(userId: string, businessId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: {
      id: agentId,
      businessId,
      business: { ownerId: userId },
    },
    include: {
      business: { select: { id: true, slug: true, name: true, description: true, phone: true, address: true, website: true } },
      _count: { select: { agentSessions: true, knowledgeItems: true, businessData: true } },
    },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, agentId } = await params;
    const agent = await verifyOwnership(session.user.id, businessId, agentId);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, agentId } = await params;
    const existing = await verifyOwnership(session.user.id, businessId, agentId);
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await request.json();

    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt }),
        ...(body.greeting !== undefined && { greeting: body.greeting }),
        ...(body.personality !== undefined && { personality: body.personality }),
        ...(body.rules !== undefined && { rules: body.rules }),
        ...(body.config !== undefined && { config: body.config }),
        ...(body.enabledTools !== undefined && { enabledTools: body.enabledTools }),
        ...(body.voiceName !== undefined && { voiceName: body.voiceName }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ agent: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, agentId } = await params;
    const existing = await verifyOwnership(session.user.id, businessId, agentId);
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await prisma.agent.update({
      where: { id: agentId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
