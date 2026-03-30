import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ businessId: string; agentId: string; dataType: string }> };

async function verifyAgent(userId: string, businessId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, businessId, business: { ownerId: userId } },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId, agentId, dataType } = await params;
    if (!await verifyAgent(session.user.id, businessId, agentId)) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const data = await prisma.businessData.findUnique({
      where: { agentId_dataType: { agentId, dataType } },
    });

    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId, agentId, dataType } = await params;
    if (!await verifyAgent(session.user.id, businessId, agentId)) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await prisma.businessData.delete({
      where: { agentId_dataType: { agentId, dataType } },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
