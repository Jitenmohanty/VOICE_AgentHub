import Stripe from "stripe";
import { prisma } from "@/lib/db";

let _stripe: Stripe | null = null;

/**
 * Lazy Stripe client. Returns null when STRIPE_SECRET_KEY is unset so the
 * rest of the app (and local dev) keeps working without billing creds —
 * billing routes return 503 in that case, the dashboard hides the Upgrade UI.
 */
export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key);
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Map a Stripe Price ID back to our internal plan id ("starter" | "pro").
 * Used by webhook handlers when the Stripe event references a price but our
 * code thinks in plan ids.
 */
export async function planIdForStripePrice(priceId: string): Promise<string | null> {
  const plan = await prisma.billingPlan.findFirst({
    where: { stripePriceId: priceId },
    select: { id: true },
  });
  return plan?.id ?? null;
}

/**
 * Build the success/cancel URLs the Stripe checkout session redirects to.
 * Uses NEXTAUTH_URL (already set in this project) so we don't introduce a
 * separate env var.
 */
export function billingReturnUrls(): { success: string; cancel: string } {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return {
    success: `${base}/business/billing?status=success`,
    cancel: `${base}/business/billing?status=canceled`,
  };
}
