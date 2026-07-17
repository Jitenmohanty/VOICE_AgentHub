import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

/**
 * GET    /api/integrations/google-calendar?businessId=  → connection status (owner or member)
 * DELETE /api/integrations/google-calendar?businessId=  → disconnect + wipe token (owner only)
 */

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = new URL(request.url).searchParams.get("businessId") || "";
  const business = await prisma.business.findFirst({
    where: { id: businessId, ...businessAccessFilter(session.user.id) },
    select: { id: true },
  });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const integration = await prisma.integration.findUnique({
    where: { businessId_provider: { businessId, provider: "google-calendar" } },
    select: { accountEmail: true, status: true, createdAt: true },
  });

  return NextResponse.json({
    connected: !!integration,
    accountEmail: integration?.accountEmail ?? null,
    status: integration?.status ?? null,
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = new URL(request.url).searchParams.get("businessId") || "";
  const owns = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!owns) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  await prisma.integration
    .delete({ where: { businessId_provider: { businessId, provider: "google-calendar" } } })
    .catch(() => null); // already disconnected — idempotent

  return NextResponse.json({ disconnected: true });
}
