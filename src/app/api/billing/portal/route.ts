import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, billingReturnUrls } from "@/lib/stripe";

const BodySchema = z.object({ businessId: z.string().min(1) });

/**
 * POST /api/billing/portal
 * Owner-only. Returns { url } for the Stripe customer portal so they can
 * change plan / update card / cancel.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Billing is not configured on this server." },
        { status: 503 },
      );
    }

    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bad request" }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { id: parsed.data.businessId, ownerId: session.user.id },
      include: { subscription: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const customerId = business.subscription?.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: "No paid subscription on file. Upgrade first to access the billing portal." },
        { status: 400 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: billingReturnUrls().success,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[Billing] portal error:", err);
    return NextResponse.json({ error: "Portal failed" }, { status: 500 });
  }
}
