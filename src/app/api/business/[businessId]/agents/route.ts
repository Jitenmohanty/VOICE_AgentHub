import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTemplateById } from "@/lib/templates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await params;

    // Verify ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const agents = await prisma.agent.findMany({
      where: { businessId },
      include: {
        _count: { select: { agentSessions: true, knowledgeItems: true, businessData: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ agents });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await params;
    const body = await request.json();

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const template = getTemplateById(body.templateType);
    if (!template) {
      return NextResponse.json({ error: "Invalid template type" }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        businessId,
        templateType: body.templateType,
        name: body.name || `${business.name} ${template.name}`,
        greeting: template.defaultGreeting,
        personality: template.defaultPersonality,
        config: body.config || {},
        enabledTools: template.capabilities,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
