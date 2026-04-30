import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { getTemplateById } from "@/lib/templates";
import { RegisterSchema } from "@/lib/schemas";
import { sendVerificationEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const limited = await checkAuthRateLimit(request);
  if (limited) return limited;

  try {
    const raw = await request.json().catch(() => ({}));
    const parse = RegisterSchema.safeParse(raw);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    const { name, email, password, businessName, industry } = parse.data;

    const template = getTemplateById(industry);
    if (!template) {
      return NextResponse.json(
        { error: "Invalid industry template" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const slug = await generateUniqueSlug(businessName);

    // Build default config from template
    const defaultConfig: Record<string, string | string[] | number | boolean> = {};
    for (const field of template.configFields) {
      if (field.defaultValue !== undefined) {
        defaultConfig[field.id] = field.defaultValue;
      }
    }
    // Personal-template specific: pre-fill identity from the registration form
    // so the agent has something to say from the very first call. Owners can
    // tweak everything later in the agent dashboard.
    if (industry === "personal") {
      if (name) defaultConfig.fullName = name;
      if (businessName && businessName !== name) defaultConfig.role = businessName;
    }

    // Create sequentially (Neon HTTP doesn't support transactions)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "BUSINESS_OWNER",
      },
    });

    const business = await prisma.business.create({
      data: {
        ownerId: user.id,
        name: businessName,
        slug,
        industry,
      },
    });

    // Personal agents are named after the person, not "{name} Personal · Portfolio"
    const agentName =
      industry === "personal" ? `${name || businessName}'s AI` : `${businessName} ${template.name}`;
    // Personal greeting interpolates the user's name if the template's default
    // greeting has the {fullName} placeholder.
    const greeting = (template.defaultGreeting || "").replace("{fullName}", name || businessName);

    const agent = await prisma.agent.create({
      data: {
        businessId: business.id,
        templateType: industry,
        name: agentName,
        greeting,
        personality: template.defaultPersonality,
        config: defaultConfig,
        enabledTools: template.capabilities,
      },
    });

    // Issue a verification token (24h) and email it. Login is blocked until consumed.
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    sendVerificationEmail({
      to: email,
      name: name ?? "",
      token,
    }).catch((err) => console.error("Verification email failed:", err));

    return NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email },
        business: { id: business.id, slug: business.slug },
        agent: { id: agent.id },
        verificationRequired: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
