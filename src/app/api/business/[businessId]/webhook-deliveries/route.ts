import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";

/**
 * GET /api/business/[businessId]/webhook-deliveries
 *
 * Owner-only. Returns the most recent webhook delivery attempts for this
 * business so the Settings page can show ✓/✗ status and latency. Capped at
 * 50 rows — older rows are kept in the DB but not surfaced.
 */
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

    const owns = await prisma.business.findFirst({
      where: { id: businessId, ...businessAccessFilter(session.user.id) },
      select: { id: true },
    });
    if (!owns) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ deliveries });
  } catch (err) {
    console.error("[Webhook deliveries] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
