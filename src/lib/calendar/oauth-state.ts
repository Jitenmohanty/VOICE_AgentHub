import { createHmac } from "node:crypto";

/**
 * CSRF token for the Google Calendar OAuth dance: HMAC over
 * (businessId, userId) keyed with INTERNAL_API_SECRET. The callback
 * recomputes it against the signed-in user, so a foreign state token
 * can't attach a calendar to someone else's business.
 */
export function signOAuthState(businessId: string, userId: string): string {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) throw new Error("INTERNAL_API_SECRET is not set");
  return createHmac("sha256", secret).update(`gcal:${businessId}:${userId}`).digest("hex");
}
