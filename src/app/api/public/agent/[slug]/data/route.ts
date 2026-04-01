import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET public structured data for an agent — no auth required */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        agents: {
          where: { isActive: true },
          take: 1,
          include: {
            businessData: {
              select: { dataType: true, data: true },
            },
          },
        },
      },
    });

    if (!business || !business.isActive || business.agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const agent = business.agents[0]!;

    return NextResponse.json({
      templateType: agent.templateType,
      data: agent.businessData,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
