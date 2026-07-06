/**
 * Google Calendar client for in-call appointment booking (Item 7).
 * Plain fetch against the REST APIs — no googleapis dependency.
 *
 * Reuses the platform's existing Google OAuth app (GOOGLE_CLIENT_ID/SECRET,
 * already required for NextAuth). The owner grants calendar scopes once via
 * /api/integrations/google-calendar/connect; we store only the refresh token
 * (AES-encrypted) and mint short-lived access tokens per request.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_API = "https://www.googleapis.com/calendar/v3";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "openid",
  "email",
].join(" ");

/** Thrown when the refresh token is revoked/expired — caller should mark needs_reauth. */
export class GoogleReauthRequiredError extends Error {
  constructor() {
    super("Google refresh token is no longer valid — owner must reconnect");
    this.name = "GoogleReauthRequiredError";
  }
}

function clientCreds() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set");
  return { clientId, clientSecret };
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  refreshToken: string | null;
  accountEmail: string | null;
}> {
  const { clientId, clientSecret } = clientCreds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    refresh_token?: string;
    id_token?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(`Google code exchange failed: ${data.error || res.status}`);

  // The id_token came directly from Google over TLS — decoding its payload
  // for the display email is safe without signature verification.
  let accountEmail: string | null = null;
  const payload = data.id_token?.split(".")[1];
  if (payload) {
    try {
      accountEmail = (JSON.parse(Buffer.from(payload, "base64url").toString()) as { email?: string }).email ?? null;
    } catch {
      accountEmail = null;
    }
  }
  return { refreshToken: data.refresh_token ?? null, accountEmail };
}

export async function getAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = clientCreds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (data.error === "invalid_grant") throw new GoogleReauthRequiredError();
  if (!res.ok || !data.access_token) throw new Error(`Google token refresh failed: ${data.error || res.status}`);
  return data.access_token;
}

interface BusyInterval {
  start: number; // epoch ms
  end: number;
}

export async function getBusyIntervals(
  accessToken: string,
  timeMinIso: string,
  timeMaxIso: string,
): Promise<BusyInterval[]> {
  const res = await fetch(`${CAL_API}/freeBusy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: timeMinIso, timeMax: timeMaxIso, items: [{ id: "primary" }] }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    calendars?: { primary?: { busy?: { start: string; end: string }[] } };
  };
  if (!res.ok) throw new Error(`Google freeBusy failed: HTTP ${res.status}`);
  return (data.calendars?.primary?.busy ?? []).map((b) => ({
    start: Date.parse(b.start),
    end: Date.parse(b.end),
  }));
}

// ── Slot proposal ────────────────────────────────────────────────────────────

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const SLOT_MINUTES = 30;
const WORK_START_HOUR = 10; // IST
const WORK_END_HOUR = 19; // IST — last slot starts 30 min before
const SCAN_DAYS = 7;

export interface ProposedSlot {
  startIso: string;
  /** Human/voice-friendly IST label, e.g. "Tuesday 8 July, 10:30 AM" */
  spoken: string;
}

export function formatSlotIST(epochMs: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(epochMs));
}

function overlapsBusy(startMs: number, endMs: number, busy: BusyInterval[]): boolean {
  return busy.some((b) => startMs < b.end && endMs > b.start);
}

/**
 * Propose up to `count` free slots in IST working hours, starting from
 * `fromMs`, filtered by an optional time-of-day preference.
 */
export function proposeSlots(
  busy: BusyInterval[],
  fromMs: number,
  count = 3,
  timePreference?: "morning" | "afternoon" | "evening",
): ProposedSlot[] {
  const slots: ProposedSlot[] = [];
  const slotMs = SLOT_MINUTES * 60 * 1000;

  // Iterate day by day in IST.
  for (let day = 0; day < SCAN_DAYS && slots.length < count; day++) {
    // Midnight IST of the target day, expressed in epoch ms.
    const istNow = fromMs + IST_OFFSET_MS;
    const istMidnight = Math.floor(istNow / 86_400_000) * 86_400_000 + day * 86_400_000;

    let startHour = WORK_START_HOUR;
    let endHour = WORK_END_HOUR;
    if (timePreference === "morning") endHour = Math.min(endHour, 12);
    if (timePreference === "afternoon") {
      startHour = Math.max(startHour, 12);
      endHour = Math.min(endHour, 16);
    }
    if (timePreference === "evening") startHour = Math.max(startHour, 16);

    for (let h = startHour; h < endHour && slots.length < count; h++) {
      for (const minutes of [0, 30]) {
        const startMs = istMidnight + (h * 60 + minutes) * 60_000 - IST_OFFSET_MS;
        const endMs = startMs + slotMs;
        // At least 60 min in the future so the business isn't ambushed.
        if (startMs < fromMs + 60 * 60 * 1000) continue;
        if (overlapsBusy(startMs, endMs, busy)) continue;
        slots.push({ startIso: new Date(startMs).toISOString(), spoken: formatSlotIST(startMs) });
        if (slots.length >= count) break;
      }
    }
  }
  return slots;
}

export async function createCalendarEvent(
  accessToken: string,
  opts: {
    startIso: string;
    durationMinutes?: number;
    summary: string;
    description: string;
    attendeeEmail?: string | null;
  },
): Promise<{ id: string; htmlLink?: string }> {
  const startMs = Date.parse(opts.startIso);
  const endMs = startMs + (opts.durationMinutes ?? SLOT_MINUTES) * 60_000;
  const res = await fetch(`${CAL_API}/calendars/primary/events?sendUpdates=all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: new Date(startMs).toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: new Date(endMs).toISOString(), timeZone: "Asia/Kolkata" },
      ...(opts.attendeeEmail ? { attendees: [{ email: opts.attendeeEmail }] } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; htmlLink?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    throw new Error(`Google event create failed: ${data.error?.message || `HTTP ${res.status}`}`);
  }
  return { id: data.id, htmlLink: data.htmlLink };
}
