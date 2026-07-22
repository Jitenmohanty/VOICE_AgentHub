import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";
import { enqueueEmbedding } from "@/lib/embeddings-queue";

type Params = { params: Promise<{ businessId: string; agentId: string }> };

async function verifyAgent(userId: string, businessId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, businessId, business: businessAccessFilter(userId) },
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
        embeddingStatus: "pending",
      },
    });

    // Durable embedding via Inngest so a returning serverless response can't
    // kill the work; failures land on the row as embeddingStatus="failed".
    await enqueueEmbedding(item.id, `${body.title}: ${body.content}`);

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
