import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { getTemplateById } from "@/lib/templates";

/**
 * POST — Create a Business + Agent for an existing user (Google OAuth flow).
 * Called from the onboarding page when user has no business yet.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessName, industry } = await request.json();

    if (!businessName || !industry) {
      return NextResponse.json(
        { error: "Business name and industry are required" },
        { status: 400 },
      );
    }

    const template = getTemplateById(industry);
    if (!template) {
      return NextResponse.json(
        { error: "Invalid industry template" },
        { status: 400 },
      );
    }

    // Check if user already has a business
    const existing = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a business" },
        { status: 409 },
      );
    }

    const slug = await generateUniqueSlug(businessName);

    // Build default config
    const defaultConfig: Record<string, string | string[] | number | boolean> = {};
    for (const field of template.configFields) {
      if (field.defaultValue !== undefined) {
        defaultConfig[field.id] = field.defaultValue;
      }
    }

    // Set role to BUSINESS_OWNER if not already
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "BUSINESS_OWNER" },
    });

    // Create Business + Agent (sequential for Neon HTTP)
    const business = await prisma.business.create({
      data: {
        ownerId: session.user.id,
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

    return NextResponse.json(
      { business: { id: business.id, slug: business.slug }, agent: { id: agent.id } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Onboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
