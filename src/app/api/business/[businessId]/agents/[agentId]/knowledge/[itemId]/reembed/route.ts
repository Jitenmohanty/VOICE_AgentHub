import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";
import { enqueueEmbedding } from "@/lib/embeddings-queue";

type Params = { params: Promise<{ businessId: string; agentId: string; itemId: string }> };

/**
 * Manually re-embed a knowledge item — the dashboard "Retry" action for items
 * stuck in `pending` or `failed`. Resets status and re-enqueues the durable
 * embedding job without requiring the owner to edit the content.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId, agentId, itemId } = await params;

    const item = await prisma.knowledgeItem.findFirst({
      where: { id: itemId, agentId, agent: { businessId, business: businessAccessFilter(session.user.id) } },
      select: { id: true, title: true, content: true },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.knowledgeItem.update({
      where: { id: itemId },
      data: { embeddingStatus: "pending", embeddingError: null },
    });
    await enqueueEmbedding(item.id, `${item.title}: ${item.content}`);

    return NextResponse.json({ ok: true, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
