import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/invites/[token]
 *
 * Anonymous preview — returns the business name and invited email so the
 * /invites/[token] landing page can render a meaningful "accept this invite"
 * card before the user signs in. No session required.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const invite = await prisma.businessInvite.findUnique({
      where: { token },
      include: {
        business: { select: { name: true, slug: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invite already accepted", state: "accepted" }, { status: 410 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired", state: "expired" }, { status: 410 });
    }

    return NextResponse.json({
      email: invite.email,
      businessName: invite.business.name,
      businessSlug: invite.business.slug,
      inviterName: invite.invitedBy?.name ?? null,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    console.error("[Invite GET] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/invites/[token]
 *
 * Accept an invite. Requires the user to be signed in. The signed-in user's
 * email MUST match the invite's email — otherwise an attacker who got the
 * token could attach the membership to a different account.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const { token } = await params;
    const invite = await prisma.businessInvite.findUnique({
      where: { token },
      include: { business: { select: { id: true, ownerId: true } } },
    });

    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.acceptedAt) return NextResponse.json({ error: "Already accepted" }, { status: 410 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

    // The session's email must match the invited address. This is the
    // anti-token-theft check — without it, anyone with the URL could attach
    // the membership to their own account.
    if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: `This invite is for ${invite.email}. Sign in with that account.` },
        { status: 403 },
      );
    }

    // Owner of the business can't also be a member.
    if (invite.business.ownerId === session.user.id) {
      await prisma.businessInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return NextResponse.json({ businessId: invite.business.id, alreadyOwner: true });
    }

    // Idempotent: if a membership already exists (e.g. the user re-clicked
    // the email link), we just mark the invite accepted and return the same
    // success response.
    await prisma.$transaction([
      prisma.businessMember.upsert({
        where: {
          businessId_userId: {
            businessId: invite.business.id,
            userId: session.user.id,
          },
        },
        create: {
          businessId: invite.business.id,
          userId: session.user.id,
          role: invite.role,
          invitedBy: invite.invitedById ?? undefined,
        },
        update: {},
      }),
      prisma.businessInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ businessId: invite.business.id });
  } catch (err) {
    console.error("[Invite POST] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
