import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { triggerPostCallAnalysis } from "@/lib/post-call";

type Params = { params: Promise<{ id: string }> };

/** Verify the session belongs to the authenticated owner's agents */
async function findOwnedSession(userId: string, sessionId: string) {
  return prisma.agentSession.findFirst({
    where: {
      id: sessionId,
      agent: { business: { ownerId: userId } },
    },
    include: {
      agent: { select: { name: true, templateType: true, business: { select: { name: true } } } },
    },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const agentSession = await findOwnedSession(session.user.id, id);

    if (!agentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session: agentSession });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await findOwnedSession(session.user.id, id);

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate the workflow status if provided.
    const ALLOWED_LEAD_STATUS = ["new", "contacted", "qualified", "won", "lost", "archived"] as const;
    if (body.leadStatus !== undefined && !ALLOWED_LEAD_STATUS.includes(body.leadStatus)) {
      return NextResponse.json(
        { error: `leadStatus must be one of: ${ALLOWED_LEAD_STATUS.join(", ")}` },
        { status: 400 },
      );
    }

    const updated = await prisma.agentSession.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.transcript !== undefined && { transcript: body.transcript }),
        ...(body.summary !== undefined && { summary: body.summary }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.feedback !== undefined && { feedback: body.feedback }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.leadStatus !== undefined && { leadStatus: body.leadStatus }),
      },
    });

    // Trigger Claude post-call analysis when session completes
    if (body.status === "completed" && body.transcript) {
      triggerPostCallAnalysis(id);
    }

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await findOwnedSession(session.user.id, id);

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.agentSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
