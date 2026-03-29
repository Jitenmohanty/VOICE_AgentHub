import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
  const hotelName = (config.hotelName as string) || "Grand Hotel";
  const hotelType = (config.hotelType as string) || "Luxury";

  return `You are the AI concierge for ${hotelName}, a ${hotelType} hotel. You speak in a warm, professional tone. You help guests with:
- Room bookings and availability checks
- Room service orders
- Local recommendations (restaurants, attractions, transport)
- Handling complaints with empathy
- Providing hotel information (amenities, check-in/out times, policies)

Always greet guests warmly. If you don't know something specific, offer to connect them with human staff. Never make up information about the hotel.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "checkAvailability",
      description: "Check room availability for given dates",
      parameters: {
        type: "object",
        properties: {
          checkIn: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
          checkOut: { type: "string", description: "Check-out date (YYYY-MM-DD)" },
          roomType: { type: "string", description: "Type of room requested", enum: ["standard", "deluxe", "suite", "penthouse"] },
        },
        required: ["checkIn", "checkOut"],
      },
    },
    {
      name: "placeRoomServiceOrder",
      description: "Place a room service order for a guest",
      parameters: {
        type: "object",
        properties: {
          roomNumber: { type: "string", description: "Guest room number" },
          items: { type: "string", description: "Comma-separated list of items" },
        },
        required: ["roomNumber", "items"],
      },
    },
    {
      name: "getLocalRecommendations",
      description: "Get local restaurant, attraction, or transport recommendations",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Type of recommendation", enum: ["restaurant", "attraction", "transport"] },
        },
        required: ["category"],
      },
    },
  ];
}

export function handleToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "checkAvailability":
      return JSON.stringify({ available: true, rooms: [{ type: args.roomType || "deluxe", price: "$250/night", count: 3 }] });
    case "placeRoomServiceOrder":
      return JSON.stringify({ orderId: `RS-${Date.now()}`, estimatedTime: "30 minutes", status: "confirmed" });
    case "getLocalRecommendations":
      return JSON.stringify({ recommendations: [{ name: "Le Bistro", rating: 4.5, distance: "0.5 km" }, { name: "City Park", rating: 4.8, distance: "1 km" }] });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
