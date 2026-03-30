import { prisma } from "@/lib/db";

/** Convert text to URL-safe slug with random suffix */
export function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/** Check if slug is available in the database */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await prisma.business.findUnique({ where: { slug } });
  return !existing;
}

/** Generate a unique slug, retrying if taken */
export async function generateUniqueSlug(text: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug(text);
    if (await isSlugAvailable(slug)) return slug;
  }
  // Fallback: longer random suffix
  return generateSlug(text + "-" + Date.now().toString(36));
}
