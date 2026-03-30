import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const url = process.env.DATABASE_URL!;
const adapter = new PrismaNeonHttp(url, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  const businesses = await prisma.business.findMany({ include: { agents: true } });

  for (const biz of businesses) {
    const agent = biz.agents[0];
    if (!agent) continue;

    const unlinked = await prisma.agentSession.findMany({
      where: { userId: biz.ownerId, agentId: null },
      select: { id: true },
    });

    console.log(`${biz.name}: ${unlinked.length} unlinked sessions`);

    for (const s of unlinked) {
      await prisma.agentSession.update({
        where: { id: s.id },
        data: { agentId: agent.id },
      });
    }
  }

  // Verify
  const stillUnlinked = await prisma.agentSession.count({ where: { agentId: null } });
  console.log(`Remaining unlinked sessions: ${stillUnlinked}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
