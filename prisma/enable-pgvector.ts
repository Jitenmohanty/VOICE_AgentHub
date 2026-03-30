import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
  console.log("pgvector extension enabled");

  // Ensure the embedding column exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'KnowledgeItem' AND column_name = 'embedding'
      ) THEN
        ALTER TABLE "KnowledgeItem" ADD COLUMN embedding vector(768);
      END IF;
    END $$;
  `);
  console.log("embedding column verified");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
