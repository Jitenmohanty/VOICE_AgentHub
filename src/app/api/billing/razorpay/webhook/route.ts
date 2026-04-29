import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { planIdForRazorpayPlan } from "@/lib/razorpay";

// Same rule as Stripe: the body must be read as raw bytes BEFORE any JSON
// parsing for the HMAC signature check to be valid.
export const runtime = "nodejs";

interface RazorpayWebhookEvent {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscription };
    payment?: { entity: RazorpayPayment };
  };
}
interface RazorpaySubscription {
  id: string;
  customer_id?: string | null;
  plan_id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  cancel_at_cycle_end?: 0 | 1;
  notes?: Record<string, string>;
}
interface RazorpayPayment {
  subscription_id?: string | null;
  customer_id?: string | null;
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * POST /api/billing/razorpay/webhook
 * Razorpay → us. Verified via RAZORPAY_WEBHOOK_SECRET.
 *
 * Events handled:
 *   subscription.activated  → first activation, mark active
 *   subscription.charged    → period rollover, refresh dates
 *   subscription.cancelled  → drop to free immediately
 *   subscription.completed  → run finished (10 yrs by default, drop to free)
 *   subscription.paused     → mark past_due (reuses Stripe's vocabulary)
 *   payment.failed          → mark past_due
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Razorpay webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = request.headers.get("x-razorpay-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing x-razorpay-signature" }, { status: 400 });
  }

  const raw = await request.text();
  if (!verifySignature(raw, sig, secret)) {
    console.error("[Razorpay webhook] signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(raw) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged":
        if (event.payload.subscription?.entity) {
          await handleSubscriptionChanged(event.payload.subscription.entity, "active");
        }
        break;
      case "subscription.cancelled":
      case "subscription.completed":
        if (event.payload.subscription?.entity) {
          await handleSubscriptionEnded(event.payload.subscription.entity);
        }
        break;
      case "subscription.paused":
      case "payment.failed":
        if (event.payload.subscription?.entity) {
          await handleSubscriptionChanged(event.payload.subscription.entity, "past_due");
        } else if (event.payload.payment?.entity) {
          await markSubscriptionPastDueByCustomer(event.payload.payment.entity);
        }
        break;
      // Other events (subscription.pending, subscription.authenticated, etc.)
      // are no-ops — subscription.activated/charged is the truth source.
    }
  } catch (err) {
    console.error("[Razorpay webhook] handler error:", event.event, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChanged(sub: RazorpaySubscription, status: string) {
  const planId = (await planIdForRazorpayPlan(sub.plan_id)) ?? sub.notes?.planId ?? null;
  const businessId = sub.notes?.businessId ?? null;
  if (!businessId || !planId) {
    console.warn("[Razorpay webhook] subscription missing metadata:", sub.id);
    return;
  }

  const periodStart = sub.current_start ? new Date(sub.current_start * 1000) : new Date();
  const periodEnd = sub.current_end
    ? new Date(sub.current_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      planId,
      status,
      paymentProvider: "razorpay",
      razorpayCustomerId: sub.customer_id ?? null,
      razorpaySubscriptionId: sub.id,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: !!sub.cancel_at_cycle_end,
      lastQuotaNotice: "none",
    },
    update: {
      planId,
      status,
      paymentProvider: "razorpay",
      razorpayCustomerId: sub.customer_id ?? null,
      razorpaySubscriptionId: sub.id,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: !!sub.cancel_at_cycle_end,
      // Reset notice tracking on plan change so the fresh period gets fresh alerts.
      lastQuotaNotice: "none",
    },
  });
}

async function handleSubscriptionEnded(sub: RazorpaySubscription) {
  const businessId = sub.notes?.businessId ?? null;
  if (!businessId) return;
  // Drop to free, same semantics as the Stripe cancellation path.
  await prisma.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      planId: "free",
      status: "canceled",
      paymentProvider: null,
      razorpayCustomerId: sub.customer_id ?? null,
      razorpaySubscriptionId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      lastQuotaNotice: "none",
    },
    update: {
      planId: "free",
      status: "canceled",
      paymentProvider: null,
      razorpaySubscriptionId: null,
      cancelAtPeriodEnd: false,
      lastQuotaNotice: "none",
    },
  });
}

async function markSubscriptionPastDueByCustomer(payment: RazorpayPayment) {
  const customerId = payment.customer_id;
  if (!customerId) return;
  await prisma.subscription.updateMany({
    where: { razorpayCustomerId: customerId },
    data: { status: "past_due" },
  });
}
