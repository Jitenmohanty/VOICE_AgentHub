import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessAccessFilter } from "@/lib/access";
import { pushLeadToCrm } from "@/lib/crm";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/sessions/[id]/crm-push — owner or team member.
 * Manual (re-)push of a session's lead into the connected CRM. Covers the
 * two cases the automatic pipeline can't: a push that failed after the email
 * already stamped delivery idempotency, and sessions from before the CRM was
 * connected. Overwrites the previous crmError / stamps crmPushedAt on success.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const agentSession = await prisma.agentSession.findFirst({
      where: { id, agent: { business: businessAccessFilter(session.user.id) } },
      select: {
        id: true,
        callerName: true,
        callerPhone: true,
        callerEmail: true,
        capturedLead: true,
        agent: {
          select: {
            business: {
              select: { crmProvider: true, crmConfig: true, crmSecretEncrypted: true },
            },
          },
        },
      },
    });
    if (!agentSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const business = agentSession.agent?.business;
    if (!business?.crmProvider || !business.crmSecretEncrypted) {
      return NextResponse.json({ error: "No CRM connected — connect one in Settings first" }, { status: 400 });
    }

    const lead = agentSession.capturedLead as { intent?: string; notes?: string } | null;
    if (!lead?.intent) {
      return NextResponse.json({ error: "This session has no captured lead to push" }, { status: 400 });
    }

    const result = await pushLeadToCrm({
      provider: business.crmProvider,
      secretEncrypted: business.crmSecretEncrypted,
      config: business.crmConfig,
      lead: {
        name: agentSession.callerName,
        phone: agentSession.callerPhone,
        email: agentSession.callerEmail,
        intent: lead.intent,
        notes: lead.notes,
      },
    });

    await prisma.agentSession.update({
      where: { id },
      data: {
        crmPushedAt: result.ok ? new Date() : null,
        crmRecordId: result.recordId ?? null,
        crmError: result.ok ? null : (result.error ?? "unknown error").slice(0, 1000),
      },
    });

    return NextResponse.json({ result }, { status: result.ok ? 200 : 502 });
  } catch (err) {
    console.error("[CRM re-push] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
