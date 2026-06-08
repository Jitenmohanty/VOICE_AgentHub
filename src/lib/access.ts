import type { Prisma } from "@prisma/client";

/**
 * Prisma WHERE fragment that matches a Business if the user is the owner OR
 * an accepted team member. Embed this everywhere a route was previously
 * scoping by `ownerId: userId` directly.
 *
 *   const business = await prisma.business.findFirst({
 *     where: { id: businessId, ...businessAccessFilter(userId) },
 *   });
 */
export function businessAccessFilter(userId: string): Prisma.BusinessWhereInput {
  return {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  };
}

/**
 * Same shape, nested for the common "scoped by business" pattern used on
 * agent / session / knowledge / data routes:
 *
 *   where: { id: agentId, business: businessAccessFilter(userId) }
 */
export function nestedBusinessAccessFilter(userId: string): Prisma.BusinessWhereInput {
  return businessAccessFilter(userId);
}
