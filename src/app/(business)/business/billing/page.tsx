import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBusinessUsageSnapshot } from "@/lib/ratelimit";
import { isStripeConfigured } from "@/lib/stripe";
import { BillingActions } from "./BillingActions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Show billing for the user's first business (single-business per owner today).
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
  const periodLabel = snapshot.periodStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="font-(family-name:--font-heading) text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-sm text-[#8888AA]">{business.name}</p>
      </div>

      {/* ── Current usage ── */}
      <section className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#666680] uppercase tracking-wider">Current plan</p>
            <p className="text-xl font-semibold text-white capitalize">
              {snapshot.planId}
              {sub?.status && sub.status !== "active" && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 align-middle">
                  {sub.status}
                </span>
              )}
            </p>
          </div>
          <p className="text-xs text-[#666680]">{periodLabel}</p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-white">{snapshot.usedMinutes} / {snapshot.monthlyMinutes} min</span>
            <span className="text-[#8888AA]">{snapshot.remainingMinutes} min left</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${snapshot.percentUsed}%`,
                background:
                  snapshot.percentUsed >= 100
                    ? "#EF4444"
                    : snapshot.percentUsed >= 80
                      ? "#F59E0B"
                      : "linear-gradient(90deg, #00D4FF, #6366F1)",
              }}
            />
          </div>
          <p className="text-xs text-[#666680] mt-2">
            Period: {snapshot.periodStart.toUTCString().split(",")[1]?.trim()} → today (UTC).
            Counts every completed call against the cap; overflow is rejected with a 429.
          </p>
        </div>
      </section>

      {/* ── Plan picker ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === snapshot.planId;
            return (
              <div
                key={plan.id}
                className={`glass rounded-2xl p-5 flex flex-col ${isCurrent ? "ring-1 ring-[#00D4FF]" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white">{plan.name}</p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider text-[#00D4FF]">Current</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">
                  ${(plan.priceCents / 100).toFixed(0)}
                  <span className="text-sm font-normal text-[#8888AA]"> / mo</span>
                </p>
                <ul className="text-sm text-[#C0C0D8] mt-4 space-y-1.5">
                  <li>• {plan.monthlyMinutes} call minutes / month</li>
                  <li>• Up to {plan.maxAgents} agent{plan.maxAgents === 1 ? "" : "s"}</li>
                  <li>• Email lead delivery</li>
                  <li>• Embed widget</li>
                </ul>
                <div className="mt-5">
                  <BillingActions
                    businessId={business.id}
                    planId={plan.id}
                    isCurrent={isCurrent}
                    isFree={plan.priceCents === 0}
                    stripeReady={stripeReady && !!plan.stripePriceId}
                    hasSubscription={!!sub?.stripeCustomerId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!stripeReady && (
        <p className="text-xs text-[#666680] text-center">
          Stripe is not configured on this server — paid plans are visible but cannot be purchased.
          Set <code className="text-[#00D4FF]">STRIPE_SECRET_KEY</code> + per-plan price IDs to enable checkout.
        </p>
      )}

      <div className="text-center">
        <Link href="/business/dashboard" className="text-sm text-[#8888AA] hover:text-white">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
