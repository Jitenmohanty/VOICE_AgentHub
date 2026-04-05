import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { getTemplateById } from "@/lib/templates";
import { RegisterSchema } from "@/lib/schemas";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
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

    const agent = await prisma.agent.create({
      data: {
        businessId: business.id,
        templateType: industry,
        name: `${businessName} ${template.name}`,
        greeting: template.defaultGreeting,
        personality: template.defaultPersonality,
        config: defaultConfig,
        enabledTools: template.capabilities,
      },
    });

    // Fire-and-forget welcome email (don't block the response)
    sendWelcomeEmail({
      to: email,
      name: name ?? "",
      businessName,
      industry,
    }).catch((err) => console.error("Welcome email failed:", err));

    return NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email },
        business: { id: business.id, slug: business.slug },
        agent: { id: agent.id },
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
