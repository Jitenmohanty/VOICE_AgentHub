import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const agentSession = await prisma.agentSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!agentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await prisma.agentSession.update({
      where: { id },
      data: {
        ...(body.transcript !== undefined && { transcript: body.transcript }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.feedback !== undefined && { feedback: body.feedback }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const agentSession = await prisma.agentSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!agentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.agentSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
