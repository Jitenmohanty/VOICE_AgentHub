import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET public agent info — no auth required */
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
          select: {
            id: true,
            name: true,
            templateType: true,
            greeting: true,
            description: true,
            config: true,
          },
        },
      },
    });

    if (!business || !business.isActive || business.agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const agent = business.agents[0]!;

    // Get template info for accentColor/icon
    const { getTemplateById } = await import("@/lib/templates");
    const template = getTemplateById(agent.templateType);

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        greeting: agent.greeting,
        description: agent.description,
        templateType: agent.templateType,
        accentColor: template?.accentColor || "#00D4FF",
        icon: template?.icon || "Bot",
      },
      business: {
        name: business.name,
        logoUrl: business.logoUrl,
        slug: business.slug,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
