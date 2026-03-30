import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST — create a voice session for an authenticated business owner testing their agent.
 * Accepts either `agentId` (new flow) or `agentType` (legacy).
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let agentId: string;

    if (body.agentId) {
      // New flow: agentId provided directly
      const agent = await prisma.agent.findFirst({
        where: { id: body.agentId, business: { ownerId: session.user.id } },
      });
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      agentId = agent.id;
    } else if (body.agentType) {
      // Legacy flow: find the owner's first agent matching this template type
      const agent = await prisma.agent.findFirst({
        where: {
          templateType: body.agentType,
          business: { ownerId: session.user.id },
        },
      });
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      agentId = agent.id;
    } else {
      return NextResponse.json({ error: "agentId or agentType required" }, { status: 400 });
    }

    const agentSession = await prisma.agentSession.create({
      data: {
        agentId,
        title: "Voice Session",
        status: "active",
      },
    });

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    return NextResponse.json({ apiKey, sessionId: agentSession.id });
  } catch (error) {
    console.error("[API] /api/gemini/session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
