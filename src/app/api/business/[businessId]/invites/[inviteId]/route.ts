import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/business/[businessId]/invites/[inviteId]
 *
 * Revokes a pending invite. Owner-only.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ businessId: string; inviteId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { businessId, inviteId } = await params;

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Only the owner can manage invites" }, { status: 403 });
    }

    const invite = await prisma.businessInvite.findFirst({
      where: { id: inviteId, businessId },
    });
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await prisma.businessInvite.delete({ where: { id: inviteId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Invite DELETE] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
