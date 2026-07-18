/**
 * Seed a verified test user for the API test harness (scripts/api-test.mjs).
 *
 * Idempotent — safe to run repeatedly. Upserts a single BUSINESS_OWNER whose
 * email is already verified (Credentials login is blocked until emailVerified
 * is set — see src/lib/auth.ts) and who has a bcrypt password the harness knows.
 *
 * It intentionally does NOT create a Business, so the harness can exercise the
 * real POST /api/business/onboard happy path on its first run.
 *
 * Reads DATABASE_URL (+ optional TEST_EMAIL / TEST_PASSWORD) from .env.
 *
 *   node scripts/seed-test-user.mjs
 *
 * KEEP the seeded row — it is reused across future test runs.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const EMAIL = process.env.TEST_EMAIL || "apitest@voxie.test";
const PASSWORD = process.env.TEST_PASSWORD || "VoxieTest!2026";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env first.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeonHttp(process.env.DATABASE_URL, {}),
});

const hashed = await bcrypt.hash(PASSWORD, 12);

const user = await prisma.user.upsert({
  where: { email: EMAIL },
  update: { password: hashed, emailVerified: new Date(), role: "BUSINESS_OWNER" },
  create: {
    name: "API Test",
    email: EMAIL,
    password: hashed,
    emailVerified: new Date(),
    role: "BUSINESS_OWNER",
  },
});

console.log("Seeded verified test user:");
console.log("  id   :", user.id);
console.log("  email:", user.email);
console.log("  pass :", PASSWORD, "(set TEST_PASSWORD in .env to override)");

await prisma.$disconnect();
