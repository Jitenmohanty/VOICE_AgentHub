import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
  const restaurantName = (config.restaurantName as string) || "The Restaurant";
  const cuisineType = (config.cuisineType as string) || "International";
  const diningStyle = (config.diningStyle as string) || "Casual Dining";
  const openTime = (config.openTime as string) || "11:00 AM";
  const closeTime = (config.closeTime as string) || "11:00 PM";
  const kitchenCloseTime = (config.kitchenCloseTime as string) || "";
  const totalSeats = config.totalSeats ? String(config.totalSeats) : "";
  const reservationsEnabled = config.reservationsEnabled !== false;
  const deliveryEnabled = !!config.deliveryEnabled;
  const takeawayEnabled = !!config.takeawayEnabled;
  const deliveryRadius = config.deliveryRadius ? `${config.deliveryRadius} km` : "";
  const minimumOrder = (config.minimumOrder as string) || "";
  const dietaryOptions = Array.isArray(config.dietaryOptions) ? config.dietaryOptions.join(", ") : "";
  const alcoholServed = !!config.alcoholServed;
  const specialNotes = (config.specialNotes as string) || "";

  return `You are the AI host for ${restaurantName}, a ${diningStyle} ${cuisineType} restaurant.

Restaurant Details:
- Hours: ${openTime} - ${closeTime}${kitchenCloseTime ? ` (kitchen closes at ${kitchenCloseTime})` : ""}
${totalSeats ? `- Seating Capacity: ${totalSeats}` : ""}
- Reservations: ${reservationsEnabled ? "Available" : "Not available"}
- Delivery: ${deliveryEnabled ? `Available${deliveryRadius ? ` within ${deliveryRadius}` : ""}${minimumOrder ? `, min order ${minimumOrder}` : ""}` : "Not available"}
- Takeaway: ${takeawayEnabled ? "Available" : "Not available"}
${dietaryOptions ? `- Dietary Options: ${dietaryOptions}` : ""}
- Alcohol: ${alcoholServed ? "Served" : "Not served"}
${specialNotes ? `- Special: ${specialNotes}` : ""}

You handle:
- Taking food orders with customizations
- Menu recommendations based on preferences/allergies
- Table reservations${reservationsEnabled ? "" : " (currently not available)"}
- Wait time estimates
- Answering menu questions (ingredients, preparation, allergens)

Be friendly, know the menu well. Repeat orders back for confirmation.
Handle dietary restrictions carefully.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "getMenu",
      description: "Get the restaurant menu or specific category",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Menu category", enum: ["appetizers", "mains", "desserts", "drinks", "specials"] },
        },
      },
    },
    {
      name: "placeOrder",
      description: "Place a food order",
      parameters: {
        type: "object",
        properties: {
          items: { type: "string", description: "Comma-separated list of items" },
          specialRequests: { type: "string", description: "Dietary or special requests" },
          tableNumber: { type: "string", description: "Table number" },
        },
        required: ["items"],
      },
    },
    {
      name: "makeReservation",
      description: "Make a table reservation",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for reservation" },
          date: { type: "string", description: "Reservation date" },
          time: { type: "string", description: "Reservation time" },
          partySize: { type: "string", description: "Number of guests" },
        },
        required: ["name", "date", "time", "partySize"],
      },
    },
  ];
}

export function handleToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "getMenu":
      return JSON.stringify({ items: [{ name: "Chef's Special Pasta", price: "$18", description: "Fresh handmade pasta with truffle cream" }] });
    case "placeOrder":
      return JSON.stringify({ orderId: `ORD-${Date.now()}`, estimatedTime: "25 minutes", status: "confirmed" });
    case "makeReservation":
      return JSON.stringify({ reservationId: `RES-${Date.now()}`, confirmed: true, details: args });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
