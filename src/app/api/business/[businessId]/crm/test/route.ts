import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pushLeadToCrm } from "@/lib/crm";

type Params = { params: Promise<{ businessId: string }> };

/**
 * POST /api/business/[businessId]/crm/test — owner-only.
 * Pushes a clearly-labelled "Voxie Test Lead" into the connected CRM so the
 * owner can confirm credentials + field mapping land correctly BEFORE a real
 * caller's lead depends on it.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId } = await params;

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      select: { id: true, name: true, crmProvider: true, crmConfig: true, crmSecretEncrypted: true },
    });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
    if (!business.crmProvider || !business.crmSecretEncrypted) {
      return NextResponse.json({ error: "No CRM connected" }, { status: 400 });
    }

    const result = await pushLeadToCrm({
      provider: business.crmProvider,
      secretEncrypted: business.crmSecretEncrypted,
      config: business.crmConfig,
      lead: {
        name: "Voxie Test Lead",
        phone: "+919999999999",
        email: "test@voxie.example",
        intent: `Test push from Voxie for ${business.name} — safe to delete.`,
        notes: "Sent by the 'Test connection' button in Voxie settings.",
      },
    });

    return NextResponse.json({ result }, { status: result.ok ? 200 : 502 });
  } catch (err) {
    console.error("[CRM test] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
