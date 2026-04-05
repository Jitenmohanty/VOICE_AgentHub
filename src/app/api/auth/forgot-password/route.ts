import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { ForgotPasswordSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));
    const parse = ForgotPasswordSchema.safeParse(raw);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? "Invalid email" },
        { status: 400 },
      );
    }

    const { email } = parse.data;

    // Always return 200 to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      // OAuth-only account or non-existent — silently succeed
      return NextResponse.json({ ok: true });
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Create new token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    });

    await sendPasswordResetEmail({
      to: email,
      name: user.name ?? "",
      token,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
