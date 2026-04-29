import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { queryKnowledge } from "@/lib/rag";

const BodySchema = z.object({
  sessionId: z.string().cuid("Invalid session id"),
  query: z.string().min(1, "query required").max(500, "query too long"),
  k: z.number().int().min(1).max(10).optional(),
});

function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return request.headers.get("x-session-token");
}

/**
 * POST /api/public/agent/[slug]/search-knowledge
 *
 * Used by the in-call `searchKnowledge` Gemini tool to fetch fresh RAG
 * snippets when the conversation pivots to a topic the static prompt's
 * one-shot retrieval didn't cover.
 *
 * Auth: per-session bearer token (same as the PATCH session route). The
 * caller already has it from the POST /session response. This way only an
 * active session can hit the search endpoint — no scraping.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const parse = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? "Bad request" },
        { status: 400 },
      );
    }
    const { sessionId, query, k } = parse.data;

    // Verify the session exists, belongs to the slug, and the bearer matches.
    const session = await prisma.agentSession.findFirst({
      where: { id: sessionId, agent: { business: { slug } } },
      select: { id: true, agentId: true, updateToken: true, status: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const provided = extractToken(request);
    if (!session.updateToken || !provided || !tokensMatch(provided, session.updateToken)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!session.agentId) {
      return NextResponse.json({ error: "Session has no agent" }, { status: 400 });
    }

    const results = await queryKnowledge(session.agentId, query, k ?? 5);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[search-knowledge] failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
