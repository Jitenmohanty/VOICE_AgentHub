import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, businessId, business: { ownerId: session.user.id } },
    });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.agentSession.findMany({
        where: { agentId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.agentSession.count({ where: { agentId } }),
    ]);

    return NextResponse.json({
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
