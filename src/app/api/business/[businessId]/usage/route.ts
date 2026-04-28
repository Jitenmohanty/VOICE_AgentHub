import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBusinessUsageSnapshot } from "@/lib/ratelimit";

/**
 * GET /api/business/[businessId]/usage
 * Owner-only. Returns current plan + month-to-date usage snapshot for the
 * dashboard gauge. Cheap (one aggregate query + one subscription lookup).
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
      where: { id: businessId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!owns) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const snapshot = await getBusinessUsageSnapshot(businessId);
    return NextResponse.json({ usage: snapshot });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
