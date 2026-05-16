import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBusinessUsageSnapshot } from "@/lib/ratelimit";
import { isStripeConfigured } from "@/lib/stripe";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { BillingActions } from "./BillingActions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  });
  if (!business) redirect("/business/onboarding");

  const [snapshot, plans, sub] = await Promise.all([
    getBusinessUsageSnapshot(business.id),
    prisma.billingPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.subscription.findUnique({ where: { businessId: business.id }, include: { plan: true } }),
  ]);

  const stripeReady = isStripeConfigured();
  const razorpayReady = isRazorpayConfigured();
  const periodLabel = snapshot.periodStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const fmtUsd = (cents: number) => `$${(cents / 100).toFixed(0)}`;
  const fmtInr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Billing</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">Plans &amp; usage</h1>
        <p className="text-sm text-white/55 mt-1.5">{business.name}</p>
      </div>

      {/* Current usage */}
      <section className="glass-raised rounded-3xl p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">Current plan</p>
            <p className="text-2xl font-semibold tracking-tight text-white capitalize mt-1.5 inline-flex items-center gap-2">
              {snapshot.planId}
              {sub?.status && sub.status !== "active" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-300/20 capitalize align-middle font-medium">
                  {sub.status}
                </span>
              )}
            </p>
          </div>
          <p className="text-xs text-white/40">{periodLabel}</p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white tabular-nums">
              <span className="font-semibold">{snapshot.usedMinutes}</span>
              <span className="text-white/45"> / {snapshot.monthlyMinutes} min</span>
            </span>
            <span className="text-white/55 tabular-nums">{snapshot.remainingMinutes} min left</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, snapshot.percentUsed)}%`,
                background:
                  snapshot.percentUsed >= 100
                    ? "linear-gradient(90deg, #F43F5E, #FB7185)"
                    : snapshot.percentUsed >= 80
                      ? "linear-gradient(90deg, #F59E0B, #FCD34D)"
                      : "linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)",
              }}
            />
          </div>
          <p className="text-[11px] text-white/40 mt-2.5 leading-relaxed">
            Period: {snapshot.periodStart.toUTCString().split(",")[1]?.trim()} → today (UTC).
            Counts every completed call against the cap; overflow is rejected with a 429.
          </p>
        </div>
      </section>

      {/* Plan picker */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === snapshot.planId;
            return (
              <div
                key={plan.id}
                className={`relative glass-raised rounded-3xl p-6 flex flex-col ${
                  isCurrent ? "border-violet-300/40" : ""
                }`}
                style={isCurrent ? { boxShadow: "0 0 24px -8px rgba(124,58,237,0.4)" } : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white tracking-tight">{plan.name}</p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-[0.18em] ah-gradient-text font-semibold">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-white">
                  {plan.priceCents > 0 ? fmtUsd(plan.priceCents) : "Free"}
                  {plan.priceInrPaise && plan.priceInrPaise > 0 && (
                    <span className="text-sm font-normal text-white/50 ml-2">
                      / {fmtInr(plan.priceInrPaise)}
                    </span>
                  )}
                  {plan.priceCents > 0 && (
                    <span className="text-sm font-normal text-white/50"> / mo</span>
                  )}
                </p>
                <ul className="text-sm text-white/75 mt-4 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-violet-300 mt-2 shrink-0" />
                    {plan.monthlyMinutes} call minutes / month
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-violet-300 mt-2 shrink-0" />
                    Up to {plan.maxAgents} agent{plan.maxAgents === 1 ? "" : "s"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-violet-300 mt-2 shrink-0" />
                    Email lead delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-violet-300 mt-2 shrink-0" />
                    Embed widget
                  </li>
                </ul>
                <div className="mt-6 space-y-2">
                  <BillingActions
                    businessId={business.id}
                    planId={plan.id}
                    isCurrent={isCurrent}
                    isFree={plan.priceCents === 0}
                    stripeReady={stripeReady && !!plan.stripePriceId}
                    razorpayReady={razorpayReady && !!plan.razorpayPlanId}
                    hasSubscription={!!sub?.stripeCustomerId || !!sub?.razorpayCustomerId}
                    paymentProvider={sub?.paymentProvider ?? null}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!stripeReady && !razorpayReady && (
        <p className="text-[11px] text-white/40 text-center leading-relaxed">
          No payment provider is configured on this server — paid plans are visible but cannot be purchased.
          Set <code className="ah-gradient-text font-mono">STRIPE_SECRET_KEY</code> (or <code className="ah-gradient-text font-mono">RAZORPAY_KEY_ID</code> + secret) plus per-plan IDs to enable checkout.
        </p>
      )}

      <div className="text-center">
        <Link href="/business/dashboard" className="text-sm text-white/55 hover:text-white transition-colors">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
