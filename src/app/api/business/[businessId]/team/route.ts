import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTeamInviteEmail } from "@/lib/email";

/**
 * Team management for a business: list owner + members + pending invites,
 * and create new invites. Owner-only operations.
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

    // Both owner and members can view the team list.
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { joinedAt: "asc" },
        },
        invites: {
          where: { acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({
      owner: business.owner,
      members: business.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      invites: business.invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
      })),
      currentUserIsOwner: business.ownerId === session.user.id,
    });
  } catch (err) {
    console.error("[Team GET] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST creates a single-use invite. Owner-only. Validates that the recipient
 * isn't already a member and that no live invite exists for the same email.
 */
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

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      include: { owner: { select: { name: true, email: true } } },
    });
    if (!business) {
      return NextResponse.json({ error: "Only the owner can invite teammates" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!emailRaw || !/^\S+@\S+\.\S+$/.test(emailRaw)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (emailRaw === business.owner?.email?.toLowerCase()) {
      return NextResponse.json({ error: "You're already the owner of this business" }, { status: 400 });
    }

    // Already a member?
    const existingMember = await prisma.businessMember.findFirst({
      where: { businessId, user: { email: emailRaw } },
      select: { id: true },
    });
    if (existingMember) {
      return NextResponse.json({ error: "That email already belongs to a team member" }, { status: 400 });
    }

    // Reuse any live, unexpired invite — resending should bump expiry, not create dupes.
    const existingInvite = await prisma.businessInvite.findFirst({
      where: {
        businessId,
        email: emailRaw,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = existingInvite
      ? await prisma.businessInvite.update({
          where: { id: existingInvite.id },
          data: { token, expiresAt, invitedById: session.user.id },
        })
      : await prisma.businessInvite.create({
          data: {
            businessId,
            email: emailRaw,
            role: "member",
            token,
            expiresAt,
            invitedById: session.user.id,
          },
        });

    // Email is best-effort — we still return the token to the inviter so they
    // can copy/paste a link if Resend is misconfigured.
    sendTeamInviteEmail({
      to: emailRaw,
      inviterName: business.owner?.name || "",
      businessName: business.name,
      token,
    }).catch((err) => console.warn("[Team invite] email failed:", err));

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        token, // returned once so the owner can copy a fallback link
      },
    });
  } catch (err) {
    console.error("[Team POST] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
