/**
 * Returns the canonical, absolute URL of the running app (no trailing slash).
 *
 * Resolution order:
 *   1. NEXTAUTH_URL  — explicit override, used when set
 *   2. VERCEL_URL    — automatically injected on every Vercel deployment
 *   3. http://localhost:3000 — local dev fallback
 *
 * Use this anywhere you need to build an absolute URL (emails, server-to-server
 * fetches, OAuth callbacks). Never hardcode "http://localhost:3000".
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
