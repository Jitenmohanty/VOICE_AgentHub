import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { storeEmbedding } from "@/lib/rag";

type Params = { params: Promise<{ businessId: string; agentId: string; itemId: string }> };

async function verifyItem(userId: string, businessId: string, agentId: string, itemId: string) {
  return prisma.knowledgeItem.findFirst({
    where: { id: itemId, agentId, agent: { businessId, business: { ownerId: userId } } },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId, agentId, itemId } = await params;
    const item = await verifyItem(session.user.id, businessId, agentId, itemId);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId, agentId, itemId } = await params;
    if (!await verifyItem(session.user.id, businessId, agentId, itemId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = await prisma.knowledgeItem.update({
      where: { id: itemId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    // Re-generate embedding if content or title changed
    if (body.content !== undefined || body.title !== undefined) {
      generateEmbedding(`${updated.title}: ${updated.content}`)
        .then((embedding) => storeEmbedding(itemId, embedding))
        .catch((err) => console.error("[Knowledge] Re-embedding failed:", err));
    }

    return NextResponse.json({ item: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId, agentId, itemId } = await params;
    if (!await verifyItem(session.user.id, businessId, agentId, itemId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.knowledgeItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
