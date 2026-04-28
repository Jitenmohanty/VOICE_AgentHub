import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig, _extra?: Record<string, string>): string {
  const hotelName = (config.hotelName as string) || "Grand Hotel";
  const hotelType = (config.hotelType as string) || "Luxury";
  const starRating = (config.starRating as string) || "";
  const totalRooms = config.totalRooms ? String(config.totalRooms) : "";
  const checkInTime = (config.checkInTime as string) || "2:00 PM";
  const checkOutTime = (config.checkOutTime as string) || "11:00 AM";
  const roomTypes = Array.isArray(config.roomTypes) ? config.roomTypes.join(", ") : "Standard, Deluxe, Suite";
  const amenities = Array.isArray(config.amenities) ? config.amenities.join(", ") : "";
  const parkingInfo = (config.parkingInfo as string) || "";
  const roomServiceHours = (config.roomServiceHours as string) || "24/7";
  const cancellationPolicy = (config.cancellationPolicy as string) || "";
  const petFriendly = config.petPolicy ? "Yes" : "No";
  const nearbyAttractions = (config.nearbyAttractions as string) || "";

  return `You are the AI concierge for ${hotelName}, a ${starRating ? starRating + " " : ""}${hotelType} hotel${totalRooms ? ` with ${totalRooms} rooms` : ""}. You speak in a warm, professional tone.

Hotel Details:
- Check-in: ${checkInTime} | Check-out: ${checkOutTime}
- Room Types: ${roomTypes}
${amenities ? `- Amenities: ${amenities}` : ""}
${parkingInfo ? `- Parking: ${parkingInfo}` : ""}
- Room Service: ${roomServiceHours}
${cancellationPolicy ? `- Cancellation Policy: ${cancellationPolicy}` : ""}
- Pet Friendly: ${petFriendly}
${nearbyAttractions ? `- Nearby: ${nearbyAttractions}` : ""}

You help guests with:
- Describing room types, prices, and amenities (use listRooms for the live list)
- Explaining hotel policies (check-in/out, cancellation, pets)
- General information about the hotel and surroundings

For ANY booking, room-service order, or reservation request, you must use captureLead — the front desk will follow up. Never confirm a booking yourself.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "listRooms",
      description:
        "List the rooms this hotel offers, including type, price, and amenities. " +
        "Use this when the caller asks what rooms are available or what they cost. " +
        "This does NOT check live availability for specific dates — only the catalog of rooms.",
      parameters: {
        type: "object",
        properties: {
          roomType: { type: "string", description: "Optional filter by room type (e.g. deluxe, suite)" },
        },
      },
    },
  ];
}

export function handleToolCall(name: string, _args: Record<string, unknown>, _agentId?: string): string {
  // Real data is overridden in live-session.ts via fetchToolData when an
  // agentSlug is set. This default response is the offline fallback.
  switch (name) {
    case "listRooms":
      return JSON.stringify({
        rooms: [],
        note: "No room catalog configured for this hotel. The team will share details on follow-up.",
      });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
