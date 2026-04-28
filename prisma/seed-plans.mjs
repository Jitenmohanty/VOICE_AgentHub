import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
const { PrismaClient } = await import("@prisma/client");
const { PrismaNeonHttp } = await import("@prisma/adapter-neon");
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});
const p = new PrismaClient({ adapter });

const PLANS = [
  { id: "free",    name: "Free",    monthlyMinutes: 30,  maxAgents: 1, priceCents: 0,    sortOrder: 0 },
  { id: "starter", name: "Starter", monthlyMinutes: 200, maxAgents: 3, priceCents: 2900, sortOrder: 1, stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null },
  { id: "pro",     name: "Pro",     monthlyMinutes: 800, maxAgents: 10, priceCents: 9900, sortOrder: 2, stripePriceId: process.env.STRIPE_PRICE_PRO ?? null },
];

for (const plan of PLANS) {
  await p.billingPlan.upsert({
    where: { id: plan.id },
    update: { name: plan.name, monthlyMinutes: plan.monthlyMinutes, maxAgents: plan.maxAgents, priceCents: plan.priceCents, sortOrder: plan.sortOrder, stripePriceId: plan.stripePriceId ?? null },
    create: plan,
  });
  console.log(`✓ Plan ${plan.id}: ${plan.monthlyMinutes} min, ${plan.maxAgents} agents, $${plan.priceCents / 100}/mo`);
}

await p.$disconnect();
process.exit(0);
