import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { getAccessToken, GoogleReauthRequiredError } from "@/lib/calendar/google";

/**
 * Shared plumbing for the in-call booking endpoints (Item 7).
 * Auth model is identical to search-knowledge: the per-session 32-byte
 * bearer token issued at session creation.
 */

export interface BookingAuthOk {
  ok: true;
  sessionId: string;
  agentId: string;
  businessId: string;
}
export interface BookingAuthErr {
  ok: false;
  status: number;
  error: string;
}

function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function extractSessionToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return request.headers.get("x-session-token");
}

export async function authenticateBookingRequest(
  slug: string,
  sessionId: string,
  providedToken: string | null,
): Promise<BookingAuthOk | BookingAuthErr> {
  const session = await prisma.agentSession.findFirst({
    where: { id: sessionId, agent: { business: { slug } } },
    select: {
      id: true,
      agentId: true,
      updateToken: true,
      agent: { select: { businessId: true } },
    },
  });
  if (!session) return { ok: false, status: 404, error: "Session not found" };
  if (!session.updateToken || !providedToken || !tokensMatch(providedToken, session.updateToken)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  if (!session.agentId || !session.agent?.businessId) {
    return { ok: false, status: 400, error: "Session has no agent" };
  }
  return { ok: true, sessionId: session.id, agentId: session.agentId, businessId: session.agent.businessId };
}

export interface CalendarAccessOk {
  ok: true;
  accessToken: string;
}
export interface CalendarAccessErr {
  ok: false;
  /** Tool-shaped fallback payload the model knows how to act on. */
  payload: { error: string; fallback: "captureLead"; message: string };
}

/**
 * Resolve a working access token for the business's Google Calendar.
 * On a revoked refresh token, marks the integration needs_reauth so the
 * dashboard shows a reconnect prompt, and returns the captureLead fallback.
 */
export async function getCalendarAccess(businessId: string): Promise<CalendarAccessOk | CalendarAccessErr> {
  const fallback = (message: string): CalendarAccessErr => ({
    ok: false,
    payload: {
      error: "calendar_unavailable",
      fallback: "captureLead",
      message: `${message} Apologize briefly and capture the caller's details with captureLead instead — do NOT retry booking.`,
    },
  });

  const integration = await prisma.integration.findUnique({
    where: { businessId_provider: { businessId, provider: "google-calendar" } },
    select: { id: true, secretEncrypted: true, status: true },
  });
  if (!integration || integration.status !== "active") {
    return fallback("The calendar is not connected right now.");
  }

  try {
    const { refreshToken } = JSON.parse(decryptSecret(integration.secretEncrypted)) as { refreshToken: string };
    const accessToken = await getAccessToken(refreshToken);
    return { ok: true, accessToken };
  } catch (err) {
    if (err instanceof GoogleReauthRequiredError) {
      await prisma.integration
        .update({ where: { id: integration.id }, data: { status: "needs_reauth" } })
        .catch(() => null);
    }
    console.error("[Booking] calendar access failed:", err);
    return fallback("The calendar could not be reached.");
  }
}
