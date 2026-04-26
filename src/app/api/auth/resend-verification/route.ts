import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { ResendVerificationSchema } from "@/lib/schemas";
import { sendVerificationEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const limited = await checkAuthRateLimit(request);
  if (limited) return limited;

  try {
    const raw = await request.json().catch(() => ({}));
    const parse = ResendVerificationSchema.safeParse(raw);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? "Invalid email" },
        { status: 400 },
      );
    }

    const { email } = parse.data;

    // Always return 200 to prevent email enumeration.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified || !user.password) {
      // Already verified, nonexistent, or OAuth-only — silently succeed.
      return NextResponse.json({ ok: true });
    }

    // Invalidate any existing verification tokens for this address.
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail({
      to: email,
      name: user.name ?? "",
      token,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
