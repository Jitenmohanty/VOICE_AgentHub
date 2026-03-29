import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAgentById } from "@/lib/agents";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentType, config } = await request.json();

    if (!agentType) {
      return NextResponse.json(
        { error: "agentType is required" },
        { status: 400 }
      );
    }

    // Create agent session record with initial title
    const agent = getAgentById(agentType);
    const agentSession = await prisma.agentSession.create({
      data: {
        userId: session.user.id,
        agentType,
        title: `${agent?.name || agentType} Session`,
        config: config || {},
        status: "active",
      },
    });

    // Return the API key for client-side Gemini connection
    // In production, consider using a proxy or ephemeral tokens
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      apiKey,
      sessionId: agentSession.id,
    });
  } catch (error) {
    console.error("[API] /api/gemini/session error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
