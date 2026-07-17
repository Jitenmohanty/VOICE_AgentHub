import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSecretsCryptoConfigured } from "@/lib/crypto";
import { GOOGLE_CALENDAR_SCOPES } from "@/lib/calendar/google";
import { signOAuthState } from "@/lib/calendar/oauth-state";
import { getAppUrl } from "@/lib/url";

/**
 * GET /api/integrations/google-calendar/connect?businessId=...
 * Owner-only. Redirects to the Google consent screen for calendar scopes.
 * Reuses the platform's NextAuth Google OAuth app — add
 *   {APP_URL}/api/integrations/google-calendar/callback
 * as an authorized redirect URI in the Google console.
 *
 * CSRF: `state` carries businessId + an HMAC over (businessId, userId) keyed
 * with INTERNAL_API_SECRET (src/lib/calendar/oauth-state.ts); the callback
 * recomputes it against the signed-in user, so a foreign state token can't
 * attach a calendar to someone else's business.
 */

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = new URL(request.url).searchParams.get("businessId") || "";
  const owns = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!owns) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 503 });
  }
  if (!isSecretsCryptoConfigured()) {
    return NextResponse.json(
      { error: "Calendar integration is not enabled (SECRETS_ENCRYPTION_KEY missing)" },
      { status: 503 },
    );
  }

  const redirectUri = `${getAppUrl()}/api/integrations/google-calendar/callback`;
  const state = `${businessId}.${signOAuthState(businessId, session.user.id)}`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: "offline",
    prompt: "consent", // force a refresh token even on re-grant
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
