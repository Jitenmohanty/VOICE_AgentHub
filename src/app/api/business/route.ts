import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

/**
 * GET current user's business(es). Returns businesses they own AND businesses
 * they've been invited into as a team member.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businesses = await prisma.business.findMany({
      where: businessAccessFilter(session.user.id),
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            templateType: true,
            isActive: true,
            businessId: true,
            _count: { select: { agentSessions: true, knowledgeItems: true, businessData: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ businesses });
  } catch (err) {
    console.error("[GET /api/business] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
