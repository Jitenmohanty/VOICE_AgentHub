import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, planIdForStripePrice } from "@/lib/stripe";

// Stripe signs raw bytes — we must NOT JSON-parse the body before verifying.
export const runtime = "nodejs";

/**
 * POST /api/billing/webhook
 * Stripe → us. Verified via STRIPE_WEBHOOK_SECRET. Handles:
 *  - checkout.session.completed       → first subscription created
 *  - customer.subscription.updated    → plan change, period rollover
 *  - customer.subscription.deleted    → downgrade to free
 *  - invoice.payment_failed           → mark past_due so quota tightens
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    console.error("[Stripe webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  // Read the body as raw text — Stripe.constructEvent re-parses + verifies.
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[Stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.created":
        await handleSubscriptionChanged(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      // Other events (invoice.paid, etc.) are no-ops here — Subscription
      // status from customer.subscription.updated is enough for us.
    }
  } catch (err) {
    console.error("[Stripe webhook] handler error:", event.type, err);
    // Return 500 so Stripe retries. Don't acknowledge a failed write.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const businessId = session.metadata?.businessId;
  const planId = session.metadata?.planId;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!businessId || !planId || !customerId || !subscriptionId) {
    console.warn("[Stripe webhook] checkout.completed missing fields", { businessId, planId, customerId, subscriptionId });
    return;
  }

  // The subsequent customer.subscription.updated will fill in period dates.
  // For now stamp the customer + subscription IDs so the portal can find them.
  await upsertSubscription({
    businessId,
    planId,
    status: "active",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
  });
}

async function handleSubscriptionChanged(sub: Stripe.Subscription) {
  // Pull plan from the price on the first item, OR from metadata as a fallback.
  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  const planFromPrice = priceId ? await planIdForStripePrice(priceId) : null;
  const planId = planFromPrice ?? sub.metadata?.planId ?? null;
  const businessId = sub.metadata?.businessId ?? null;
  if (!businessId || !planId) {
    console.warn("[Stripe webhook] subscription.changed without metadata", sub.id);
    return;
  }

  await upsertSubscription({
    businessId,
    planId,
    status: sub.status,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    currentPeriodStart: new Date((item?.current_period_start ?? sub.start_date) * 1000),
    currentPeriodEnd: new Date((item?.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) * 1000),
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const businessId = sub.metadata?.businessId;
  if (!businessId) return;
  // Drop them back to the free plan immediately. We could also keep them on
  // the paid plan until period_end — for v1 we choose the simpler "canceled
  // = free now" semantics.
  await upsertSubscription({
    businessId,
    planId: "free",
    status: "canceled",
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: null,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  // Mark all matching subscriptions past_due. Quota stays in force on the
  // existing plan; the customer portal will surface the failed invoice.
  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: "past_due" },
  });
}

interface SubscriptionUpsert {
  businessId: string;
  planId: string;
  status: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

async function upsertSubscription(input: SubscriptionUpsert): Promise<void> {
  const { businessId, ...rest } = input;
  await prisma.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      ...rest,
      // Reset notice tracking on plan change so the user gets fresh
      // 80/95/100 alerts in the new period.
      lastQuotaNotice: "none",
    },
    update: {
      ...rest,
      lastQuotaNotice: "none",
    },
  });
}
