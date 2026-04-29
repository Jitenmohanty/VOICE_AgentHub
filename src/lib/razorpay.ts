import Razorpay from "razorpay";
import { prisma } from "@/lib/db";

let _client: Razorpay | null = null;

/**
 * Lazy Razorpay client. Returns null when RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET
 * aren't both set so the rest of the app keeps working without billing creds.
 * Routes that hit this should return 503 when the client is null.
 */
export function getRazorpay(): Razorpay | null {
  if (_client) return _client;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

export function isRazorpayConfigured(): boolean {
  return !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
}

/**
 * Map a Razorpay Plan ID back to our internal plan id ("starter" | "pro").
 * Used by webhook handlers when a subscription event references a plan id
 * but our code thinks in our own internal ids.
 */
export async function planIdForRazorpayPlan(razorpayPlanId: string): Promise<string | null> {
  const plan = await prisma.billingPlan.findFirst({
    where: { razorpayPlanId },
    select: { id: true },
  });
  return plan?.id ?? null;
}

/**
 * Razorpay's Hosted-Subscription page URL. Returned to the client which
 * window.location's to it after we create the subscription.
 */
export function razorpayShortUrl(subscriptionId: string): string {
  // The subscription resource exposes a short_url field on creation; this
  // helper is just a fallback. Real callers should prefer the short_url
  // returned by subscriptions.create().
  return `https://rzp.io/rzp/${subscriptionId}`;
}

/** Public-facing return URLs after checkout — same shape as Stripe. */
export function billingReturnUrls(): { success: string; cancel: string } {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return {
    success: `${base}/business/billing?status=success`,
    cancel: `${base}/business/billing?status=canceled`,
  };
}
