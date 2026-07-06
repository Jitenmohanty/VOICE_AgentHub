import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createCalendarEvent,
  formatSlotIST,
  getBusyIntervals,
  proposeSlots,
} from "@/lib/calendar/google";
import {
  authenticateBookingRequest,
  extractSessionToken,
  getCalendarAccess,
} from "@/lib/calendar/booking";

/**
 * POST /api/public/agent/[slug]/confirm-appointment
 * Called by the in-call `confirmAppointment` tool AFTER the caller accepted
 * a slot. Re-checks the slot is still free (someone may have booked it
 * between fetch and confirm), creates the real Google Calendar event, and
 * stamps the AgentSession. Slot-taken returns alternates so the model can
 * re-offer without a second round trip.
 */

const BodySchema = z.object({
  sessionId: z.string().cuid(),
  slotIso: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "slotIso must be an ISO datetime"),
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(30),
  email: z.string().email().optional(),
  service: z.string().max(200).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const parse = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? "Bad request" }, { status: 400 });
    }
    const { sessionId, slotIso, name, phone, email, service } = parse.data;

    const auth = await authenticateBookingRequest(slug, sessionId, extractSessionToken(request));
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const startMs = Date.parse(slotIso);
    if (startMs < Date.now()) {
      return NextResponse.json({ error: "slot_in_past", message: "That slot has already passed — call bookAppointment again for fresh slots." });
    }

    const access = await getCalendarAccess(auth.businessId);
    if (!access.ok) return NextResponse.json(access.payload);

    // Conflict re-check on the exact slot window.
    const endMs = startMs + 30 * 60_000;
    const busy = await getBusyIntervals(access.accessToken, new Date(startMs).toISOString(), new Date(endMs).toISOString());
    if (busy.some((b) => startMs < b.end && endMs > b.start)) {
      const alternates = proposeSlots(
        await getBusyIntervals(access.accessToken, new Date().toISOString(), new Date(Date.now() + 7 * 86_400_000).toISOString()),
        Date.now(),
        3,
      );
      return NextResponse.json({
        error: "slot_taken",
        alternateSlots: alternates,
        message: "That slot was just taken. Apologize and offer these alternatives instead.",
      });
    }

    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { name: true },
    });

    const event = await createCalendarEvent(access.accessToken, {
      startIso: new Date(startMs).toISOString(),
      summary: `${service || "Appointment"} — ${name}`,
      description: [
        `Booked by the ${business?.name ?? "Voxie"} AI voice agent.`,
        `Caller: ${name}`,
        `Phone: ${phone}`,
        email ? `Email: ${email}` : null,
        service ? `Service: ${service}` : null,
        `Voxie session: ${sessionId}`,
      ]
        .filter(Boolean)
        .join("\n"),
      attendeeEmail: email ?? null,
    });

    const spokenTime = formatSlotIST(startMs);

    // Stamp the session — booking data + caller identity in one write.
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        bookedAppointmentAt: new Date(),
        bookedSlot: new Date(startMs).toISOString(),
        bookedEventId: event.id,
        callerName: name,
        callerPhone: phone,
        ...(email ? { callerEmail: email } : {}),
      },
    });

    return NextResponse.json({
      confirmed: true,
      spokenTime,
      message: `The appointment IS booked for ${spokenTime} (IST)${email ? " and a calendar invite was emailed" : ""}. Tell the caller it's confirmed.`,
    });
  } catch (err) {
    console.error("[confirm-appointment] failed:", err);
    return NextResponse.json({
      error: "calendar_unavailable",
      fallback: "captureLead",
      message: "The booking could not be completed. Apologize and capture the caller's details with captureLead instead.",
    });
  }
}
