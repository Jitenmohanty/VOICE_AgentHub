import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig, _extra?: Record<string, string>): string {
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

You help diners with:
- Describing the menu (use getMenu) — items, prices, ingredients, allergens
- Explaining hours, dining style, dietary options, delivery/takeaway availability
- Answering questions about the restaurant

You DO NOT:
- Place orders yourself — use captureLead and the kitchen will call back
- Confirm reservations yourself — use captureLead with the party size, date, time

Be friendly and know the menu well. Handle dietary restrictions carefully — when in doubt, capture the lead and tell them a host will confirm what's safe.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "getMenu",
      description:
        "List the restaurant's menu items, optionally filtered by category. " +
        "Use this when the caller asks what's on the menu, what something costs, or what's in a dish.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Menu category",
            enum: ["appetizers", "mains", "desserts", "drinks", "specials"],
          },
        },
      },
    },
  ];
}

export function handleToolCall(name: string, _args: Record<string, unknown>, _agentId?: string): string {
  switch (name) {
    case "getMenu":
      // Real menu is overridden in live-session.ts via fetchToolData when an
      // agentSlug is set. This default response is the offline fallback.
      return JSON.stringify({
        items: [],
        note: "No menu configured for this restaurant. The team will share details on follow-up.",
      });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
