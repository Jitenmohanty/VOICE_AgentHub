import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/business/[businessId]/team/[memberId]
 *
 * Removes a BusinessMember. Owner-only. The owner row itself is not stored
 * in BusinessMember (it lives as Business.ownerId), so this can never delete
 * the owner — keeps the "every business has exactly one owner" invariant.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ businessId: string; memberId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { businessId, memberId } = await params;

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Only the owner can remove team members" }, { status: 403 });
    }

    const member = await prisma.businessMember.findFirst({
      where: { id: memberId, businessId },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.businessMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Team DELETE member] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
