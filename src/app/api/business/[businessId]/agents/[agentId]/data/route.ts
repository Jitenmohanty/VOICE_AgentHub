import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

async function verifyAgent(userId: string, businessId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, businessId, business: { ownerId: userId } },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    if (!await verifyAgent(session.user.id, businessId, agentId)) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const data = await prisma.businessData.findMany({
      where: { agentId },
      orderBy: { dataType: "asc" },
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Upsert structured data by dataType */
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    if (!await verifyAgent(session.user.id, businessId, agentId)) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!body.dataType || !body.data) {
      return NextResponse.json({ error: "dataType and data are required" }, { status: 400 });
    }

    // Upsert: create or replace
    const existing = await prisma.businessData.findUnique({
      where: { agentId_dataType: { agentId, dataType: body.dataType } },
    });

    let result;
    if (existing) {
      result = await prisma.businessData.update({
        where: { id: existing.id },
        data: { data: body.data },
      });
    } else {
      result = await prisma.businessData.create({
        data: { agentId, dataType: body.dataType, data: body.data },
      });
    }

    return NextResponse.json({ data: result }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
