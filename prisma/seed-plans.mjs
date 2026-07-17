import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
const { PrismaClient } = await import("@prisma/client");
const { PrismaNeonHttp } = await import("@prisma/adapter-neon");
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});
const p = new PrismaClient({ adapter });

// Pricing tuned for the Indian SMB market on Razorpay (INR) and the
// international market on Stripe (USD). The free tier has no provider IDs.
// Provider price/plan IDs come from env so the same code seeds dev + prod.
const PLANS = [
  {
    id: "free", name: "Free",
    monthlyMinutes: 30, maxAgents: 1,
    priceCents: 0, priceInrPaise: 0,
    overagePaisePerMinute: null, // free stays hard-capped
    sortOrder: 0,
  },
  {
    id: "starter", name: "Starter",
    monthlyMinutes: 200, maxAgents: 3,
    priceCents: 2900,        // $29
    priceInrPaise: 239900,   // ₹2399
    overagePaisePerMinute: 300, // ₹3/min past the cap (Item 13)
    sortOrder: 1,
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
    razorpayPlanId: process.env.RAZORPAY_PLAN_STARTER ?? null,
  },
  {
    id: "pro", name: "Pro",
    monthlyMinutes: 800, maxAgents: 10,
    priceCents: 9900,        // $99
    priceInrPaise: 799900,   // ₹7999
    overagePaisePerMinute: 250, // ₹2.50/min past the cap (Item 13)
    sortOrder: 2,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO ?? null,
  },
];

for (const plan of PLANS) {
  await p.billingPlan.upsert({
    where: { id: plan.id },
    update: {
      name: plan.name,
      monthlyMinutes: plan.monthlyMinutes,
      maxAgents: plan.maxAgents,
      priceCents: plan.priceCents,
      priceInrPaise: plan.priceInrPaise,
      sortOrder: plan.sortOrder,
      stripePriceId: plan.stripePriceId ?? null,
      razorpayPlanId: plan.razorpayPlanId ?? null,
      overagePaisePerMinute: plan.overagePaisePerMinute ?? null,
    },
    create: plan,
  });
  const usd = `$${plan.priceCents / 100}`;
  const inr = plan.priceInrPaise ? `₹${plan.priceInrPaise / 100}` : "—";
  console.log(
    `✓ Plan ${plan.id}: ${plan.monthlyMinutes} min, ${plan.maxAgents} agents, ${usd} / ${inr} per mo`,
  );
}

await p.$disconnect();
process.exit(0);
