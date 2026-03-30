/**
 * One-time migration: converts single-tenant data to multi-tenant.
 * Run with: npx tsx --env-file=.env.local prisma/migrate-to-multitenant.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const adapter = new PrismaNeonHttp(url, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting multi-tenant migration...");

  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users`);

  for (const user of users) {
    // Update role
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "BUSINESS_OWNER" },
    });

    // Check if user already has a business
    const existingBiz = await prisma.business.findFirst({
      where: { ownerId: user.id },
    });
    if (existingBiz) {
      console.log(`User ${user.email} already has business: ${existingBiz.name}`);
      continue;
    }

    // Get primary agent type from sessions
    const sessions = await prisma.agentSession.findMany({
      where: { userId: user.id },
      select: { agentType: true },
    });
    const agentTypes = [...new Set(sessions.map((s) => s.agentType).filter(Boolean))];
    const primaryType = agentTypes[0] || "hotel";

    const bizName = user.name ? `${user.name}'s Business` : "My Business";
    const suffix = Math.random().toString(36).slice(2, 6);
    const slug = bizName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) + `-${suffix}`;

    // Create business (no nested create to avoid transactions)
    const business = await prisma.business.create({
      data: {
        ownerId: user.id,
        name: bizName,
        slug,
        industry: primaryType,
      },
    });

    // Create agent separately
    const agent = await prisma.agent.create({
      data: {
        businessId: business.id,
        templateType: primaryType,
        name: `${bizName} Agent`,
        config: {},
        enabledTools: [],
      },
    });

    console.log(`Created business "${business.name}" (${business.slug}) with agent ${agent.id} for ${user.email}`);

    // Link existing sessions to the new agent (one at a time to avoid transactions)
    const userSessions = await prisma.agentSession.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    let linked = 0;
    for (const s of userSessions) {
      await prisma.agentSession.update({
        where: { id: s.id },
        data: { agentId: agent.id },
      });
      linked++;
    }
    console.log(`  Linked ${linked} sessions to agent`);
  }

  console.log("Migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
