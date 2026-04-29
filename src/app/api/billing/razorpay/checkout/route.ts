import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";

const BodySchema = z.object({
  businessId: z.string().min(1),
  planId: z.enum(["starter", "pro"]),
});

/**
 * POST /api/billing/razorpay/checkout
 * Owner-only. Creates a Razorpay subscription against the BillingPlan's
 * razorpayPlanId, then returns the hosted short_url for the client to redirect
 * to. The webhook will record the activation when payment completes.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return NextResponse.json(
        { error: "Razorpay billing is not configured on this server." },
        { status: 503 },
      );
    }

    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bad request" }, { status: 400 });
    }
    const { businessId, planId } = parsed.data;

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      include: { owner: { select: { email: true, name: true } } },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const plan = await prisma.billingPlan.findUnique({ where: { id: planId } });
    if (!plan?.razorpayPlanId) {
      return NextResponse.json(
        { error: `Plan "${planId}" is not available on Razorpay — plan ID not configured.` },
        { status: 400 },
      );
    }

    // Create the subscription. total_count is the number of billing cycles —
    // 120 monthly cycles = 10 years, effectively "until the customer cancels."
    // notes are echoed back in webhook events so we can recover the mapping.
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: 120,
      notes: { businessId, planId },
    });

    // Razorpay subscriptions ship with a hosted short_url — that's the
    // checkout page the customer pays on. Use it so we don't have to embed
    // their JS SDK (which would need a different client flow).
    const url = (subscription as unknown as { short_url?: string }).short_url;
    if (!url) {
      return NextResponse.json(
        { error: "Razorpay did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url, subscriptionId: subscription.id });
  } catch (err) {
    console.error("[Billing/Razorpay] checkout error:", err);
    return NextResponse.json({ error: "Razorpay checkout failed" }, { status: 500 });
  }
}
