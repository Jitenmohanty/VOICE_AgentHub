import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET sessions for the current business owner (all their agents) */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Scope to sessions belonging to this owner's agents
    const ownerFilter = {
      agent: { business: { ownerId: session.user.id } },
    };

    const [sessions, total] = await Promise.all([
      prisma.agentSession.findMany({
        where: ownerFilter,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          agent: { select: { name: true, templateType: true } },
        },
      }),
      prisma.agentSession.count({ where: ownerFilter }),
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
