import { NextResponse } from "next/server";
import { z } from "zod";
import { getBusyIntervals, proposeSlots } from "@/lib/calendar/google";
import {
  authenticateBookingRequest,
  extractSessionToken,
  getCalendarAccess,
} from "@/lib/calendar/booking";
import { checkTransactionRateLimit } from "@/lib/ratelimit";

/**
 * POST /api/public/agent/[slug]/book-appointment
 * Called by the in-call `bookAppointment` tool. Returns up to 3 free slots
 * from the business's Google Calendar (IST working hours). On any calendar
 * failure, returns a captureLead-fallback payload instead of an HTTP error —
 * the model reads it and degrades gracefully mid-conversation.
 */

const BodySchema = z.object({
  sessionId: z.string().cuid(),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "preferredDate must be YYYY-MM-DD")
    .optional(),
  timePreference: z.enum(["morning", "afternoon", "evening"]).optional(),
  service: z.string().max(200).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const limited = await checkTransactionRateLimit(request);
    if (limited) return limited;

    const parse = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? "Bad request" }, { status: 400 });
    }
    const { sessionId, preferredDate, timePreference } = parse.data;

    const auth = await authenticateBookingRequest(slug, sessionId, extractSessionToken(request));
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const access = await getCalendarAccess(auth.businessId);
    if (!access.ok) return NextResponse.json(access.payload);

    // Scan window: preferred date (if in the future) or now, +7 days.
    const now = Date.now();
    let fromMs = now;
    if (preferredDate) {
      const parsed = Date.parse(`${preferredDate}T00:00:00+05:30`);
      if (!Number.isNaN(parsed) && parsed > now) fromMs = parsed;
    }
    const toMs = fromMs + 7 * 86_400_000;

    const busy = await getBusyIntervals(
      access.accessToken,
      new Date(fromMs).toISOString(),
      new Date(toMs).toISOString(),
    );
    const slots = proposeSlots(busy, fromMs, 3, timePreference);

    if (slots.length === 0) {
      return NextResponse.json({
        slots: [],
        message:
          "No free slots in the next 7 days for that preference. Offer to capture the caller's details with captureLead so the team can arrange a time manually.",
      });
    }

    return NextResponse.json({
      slots,
      message:
        "Offer these slots to the caller verbally (times are IST). When they pick one, confirm their name and phone, then call confirmAppointment with that slot's startIso.",
    });
  } catch (err) {
    console.error("[book-appointment] failed:", err);
    return NextResponse.json({
      error: "calendar_unavailable",
      fallback: "captureLead",
      message: "Booking is temporarily unavailable. Capture the caller's details with captureLead instead.",
    });
  }
}
