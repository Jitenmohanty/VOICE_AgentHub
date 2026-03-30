import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { storeEmbedding } from "@/lib/rag";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

async function verifyAgent(userId: string, businessId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, businessId, business: { ownerId: userId } },
  });
}

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    if (!await verifyAgent(session.user.id, businessId, agentId)) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const items = await prisma.knowledgeItem.findMany({
      where: {
        agentId,
        ...(category && { category }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, agentId } = await params;
    if (!await verifyAgent(session.user.id, businessId, agentId)) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!body.title || !body.content || !body.category) {
      return NextResponse.json({ error: "title, content, and category are required" }, { status: 400 });
    }

    const item = await prisma.knowledgeItem.create({
      data: {
        agentId,
        title: body.title,
        content: body.content,
        category: body.category,
        sourceType: body.sourceType || "TEXT",
        metadata: body.metadata || null,
      },
    });

    // Generate embedding and store via pgvector (fire-and-forget)
    generateEmbedding(`${body.title}: ${body.content}`)
      .then((embedding) => storeEmbedding(item.id, embedding))
      .catch((err) => console.error("[Knowledge] Embedding failed:", err));

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
