import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      include: {
        agents: {
          include: {
            _count: { select: { agentSessions: true, knowledgeItems: true } },
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

    // Validate webhook URL if provided — must be http(s) so we don't end up
    // with surprise file:// or javascript: scheme writes.
    if (typeof body.webhookUrl === "string" && body.webhookUrl.length > 0) {
      try {
        const u = new URL(body.webhookUrl);
        if (!["http:", "https:"].includes(u.protocol)) {
          return NextResponse.json({ error: "Webhook URL must use http or https" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
      }
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.notificationEmail !== undefined && { notificationEmail: body.notificationEmail || null }),
        ...(body.webhookUrl !== undefined && { webhookUrl: body.webhookUrl || null }),
      },
    });

    return NextResponse.json({ business: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
