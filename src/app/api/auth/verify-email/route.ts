import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VerifyEmailSchema } from "@/lib/schemas";
import { checkAuthRateLimit } from "@/lib/ratelimit";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  const limited = await checkAuthRateLimit(request);
  if (limited) return limited;

  try {
    const raw = await request.json().catch(() => ({}));
    const parse = VerifyEmailSchema.safeParse(raw);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { token } = parse.data;

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 },
      );
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: record.identifier },
      include: { businesses: { take: 1 } },
    });

    if (!user) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    const alreadyVerified = !!user.emailVerified;

    if (!alreadyVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    await prisma.verificationToken.delete({ where: { token } });

    // First-time verification — fire welcome email now that the account is real.
    if (!alreadyVerified) {
      const business = user.businesses[0];
      sendWelcomeEmail({
        to: user.email,
        name: user.name ?? "",
        businessName: business?.name ?? "your workspace",
        industry: business?.industry ?? "general",
      }).catch((err) => console.error("Welcome email failed:", err));
    }

    return NextResponse.json({ ok: true, alreadyVerified });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
