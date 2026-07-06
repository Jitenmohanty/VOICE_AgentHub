import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { exchangeCodeForTokens } from "@/lib/calendar/google";
import { getAppUrl } from "@/lib/url";
import { signOAuthState } from "@/lib/calendar/oauth-state";

/**
 * GET /api/integrations/google-calendar/callback?code&state
 * Completes the OAuth dance: verifies the state HMAC against the signed-in
 * owner, exchanges the code, stores the refresh token AES-encrypted, and
 * bounces back to settings with a status query param.
 */
export async function GET(request: Request) {
  const settingsUrl = `${getAppUrl()}/business/settings`;
  const fail = (reason: string) =>
    NextResponse.redirect(`${settingsUrl}?calendar=error&reason=${encodeURIComponent(reason)}`);

  try {
    const session = await auth();
    if (!session?.user?.id) return fail("not signed in");

    const url = new URL(request.url);
    if (url.searchParams.get("error")) return fail(url.searchParams.get("error")!);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state") || "";
    const [businessId, providedSig] = state.split(".");
    if (!code || !businessId || !providedSig) return fail("missing code/state");

    const expectedSig = signOAuthState(businessId, session.user.id);
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return fail("state mismatch");

    const owns = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!owns) return fail("business not found");

    const redirectUri = `${getAppUrl()}/api/integrations/google-calendar/callback`;
    const { refreshToken, accountEmail } = await exchangeCodeForTokens(code, redirectUri);
    if (!refreshToken) {
      // Google omits refresh_token when the user re-consents without
      // prompt=consent — our connect URL always forces it, so this is rare.
      return fail("no refresh token granted — remove Voxie from your Google account permissions and retry");
    }

    await prisma.integration.upsert({
      where: { businessId_provider: { businessId, provider: "google-calendar" } },
      create: {
        businessId,
        provider: "google-calendar",
        secretEncrypted: encryptSecret(JSON.stringify({ refreshToken })),
        accountEmail,
        status: "active",
      },
      update: {
        secretEncrypted: encryptSecret(JSON.stringify({ refreshToken })),
        accountEmail,
        status: "active",
      },
    });

    return NextResponse.redirect(`${settingsUrl}?calendar=connected`);
  } catch (err) {
    console.error("[GoogleCalendar callback] failed:", err);
    return fail("token exchange failed");
  }
}
