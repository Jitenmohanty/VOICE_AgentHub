import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptSecret, isSecretsCryptoConfigured } from "@/lib/crypto";
import { isSupportedCrmProvider } from "@/lib/crm";

type Params = { params: Promise<{ businessId: string }> };

/**
 * CRM connector management (Item 9). Mutations are OWNER-ONLY — these are
 * credentials, not read data. The credentials are AES-256-GCM encrypted at
 * rest and never returned by any route; the client only ever sees
 * `crmProvider` + non-secret `crmConfig`.
 */

const SaveSchema = z.object({
  provider: z.string().min(1),
  region: z.enum(["in", "com", "eu"]).optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
  credentials: z.object({
    clientId: z.string().min(4),
    clientSecret: z.string().min(4),
    refreshToken: z.string().min(4),
  }),
});

async function requireOwner(userId: string, businessId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, ownerId: userId },
    select: { id: true },
  });
}

/** PUT — connect/update the CRM. Body: { provider, region?, fieldMapping?, credentials } */
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId } = await params;
    if (!(await requireOwner(session.user.id, businessId))) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!isSecretsCryptoConfigured()) {
      return NextResponse.json(
        { error: "CRM integration is not enabled on this deployment (SECRETS_ENCRYPTION_KEY missing)" },
        { status: 503 },
      );
    }

    const parse = SaveSchema.safeParse(await request.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }
    const { provider, region, fieldMapping, credentials } = parse.data;
    if (!isSupportedCrmProvider(provider)) {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        crmProvider: provider,
        crmConfig: { ...(region ? { region } : {}), ...(fieldMapping ? { fieldMapping } : {}) },
        crmSecretEncrypted: encryptSecret(JSON.stringify(credentials)),
      },
      select: { id: true, crmProvider: true, crmConfig: true },
    });

    return NextResponse.json({ business });
  } catch (err) {
    console.error("[CRM save] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE — disconnect the CRM and wipe stored credentials. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { businessId } = await params;
    if (!(await requireOwner(session.user.id, businessId))) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    await prisma.business.update({
      where: { id: businessId },
      // Prisma.DbNull actually nulls the Json? column; `undefined` would leave
      // the stale crmConfig (region/fieldMapping) behind on disconnect.
      data: { crmProvider: null, crmConfig: Prisma.DbNull, crmSecretEncrypted: null },
    });
    return NextResponse.json({ disconnected: true });
  } catch (err) {
    console.error("[CRM disconnect] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
