import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, billingReturnUrls } from "@/lib/stripe";

const BodySchema = z.object({
  businessId: z.string().min(1),
  planId: z.enum(["starter", "pro"]),
});

/**
 * POST /api/billing/checkout
 * Owner-only. Returns { url } for the Stripe Checkout session. The client
 * then window.location's to it.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const { businessId, planId } = parsed.data;

    // Owner check
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      include: { owner: { select: { email: true } }, subscription: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const plan = await prisma.billingPlan.findUnique({ where: { id: planId } });
    if (!plan?.stripePriceId) {
      return NextResponse.json(
        { error: `Plan "${planId}" is not available — Stripe price not configured.` },
        { status: 400 },
      );
    }

    const urls = billingReturnUrls();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      // Reuse the existing Stripe customer if we already have one, otherwise
      // let Stripe create a new one keyed to the owner's email.
      ...(business.subscription?.stripeCustomerId
        ? { customer: business.subscription.stripeCustomerId }
        : { customer_email: business.owner?.email ?? undefined }),
      // The webhook needs to know which Business + plan this session belongs
      // to — Stripe doesn't give us a pre-created subscription id at this
      // point, so we round-trip our own metadata.
      metadata: { businessId, planId },
      subscription_data: {
        metadata: { businessId, planId },
      },
      success_url: urls.success,
      cancel_url: urls.cancel,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[Billing] checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
