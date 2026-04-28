import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig, _extra?: Record<string, string>): string {
  const clinicName = (config.clinicName as string) || "Health Center";
  const specialty = (config.specialty as string) || "General Practice";
  const additionalSpecialties = Array.isArray(config.additionalSpecialties) ? config.additionalSpecialties.join(", ") : "";
  const workingDays = Array.isArray(config.workingDays) ? config.workingDays.join(", ") : "Monday - Saturday";
  const openTime = (config.openTime as string) || "9:00 AM";
  const closeTime = (config.closeTime as string) || "6:00 PM";
  const appointmentDuration = config.appointmentDuration ? `${config.appointmentDuration} minutes` : "30 minutes";
  const walkInsAccepted = config.walkInsAccepted !== false;
  const insuranceAccepted = Array.isArray(config.insuranceAccepted) ? config.insuranceAccepted.join(", ") : "";
  const consultationFee = (config.consultationFee as string) || "";
  const emergencyProtocol = (config.emergencyProtocol as string) || "For emergencies, please call 108 or go to the nearest emergency room immediately.";
  const hasEmergencyServices = !!config.hasEmergencyServices;

  return `You are a medical reception assistant for ${clinicName} (${specialty}${additionalSpecialties ? `, also: ${additionalSpecialties}` : ""}).

Clinic Details:
- Working Days: ${workingDays}
- Hours: ${openTime} - ${closeTime}
- Appointment Duration: ${appointmentDuration}
- Walk-ins: ${walkInsAccepted ? "Accepted (may have a wait)" : "Not accepted, appointment required"}
${insuranceAccepted ? `- Insurance Accepted: ${insuranceAccepted}` : ""}
${consultationFee ? `- Consultation Fee: ${consultationFee}` : ""}
- Emergency Services: ${hasEmergencyServices ? "Available on-site" : "Not available on-site"}

You help with:
- Describing the clinic's doctors and their hours (use listDoctors)
- Sharing services offered, hours, fees, and accepted insurance
- General clinic information

You DO NOT:
- Schedule appointments yourself — use captureLead so the front desk can call back
- Diagnose conditions or interpret symptoms
- Recommend medications or dosages

CRITICAL RULES:
- Always clarify you are an AI assistant, not a doctor.
- For potential emergencies, immediately use flagEmergency and stop the rest of the conversation: ${emergencyProtocol}
- If the caller describes symptoms, do NOT diagnose — capture the lead with high urgency and tell them the clinic will call back.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "listDoctors",
      description:
        "List the doctors at this clinic and their available days/hours. " +
        "Use this when the caller asks who's available or which doctors specialize in what. " +
        "This does NOT book or hold a slot — only lists who's on the roster.",
      parameters: {
        type: "object",
        properties: {
          day: { type: "string", description: "Optional filter by day of week (e.g. Monday)" },
        },
      },
    },
    {
      name: "flagEmergency",
      description:
        "Use ONLY for medical emergencies (chest pain, stroke symptoms, severe bleeding, breathing trouble, " +
        "loss of consciousness, suicide risk, severe injury). Returns the local emergency instructions.",
      parameters: {
        type: "object",
        properties: {
          symptoms: { type: "string", description: "Reported symptoms or situation" },
        },
        required: ["symptoms"],
      },
    },
  ];
}

export function handleToolCall(name: string, _args: Record<string, unknown>, _agentId?: string): string {
  switch (name) {
    case "listDoctors":
      // Real data is overridden in live-session.ts via fetchToolData when an
      // agentSlug is set. This default response is the offline fallback.
      return JSON.stringify({
        doctors: [],
        note: "No doctor roster configured. The clinic will share details on follow-up.",
      });
    case "flagEmergency":
      return JSON.stringify({
        action: "EMERGENCY",
        message:
          "This sounds like an emergency. Please call your local emergency number (911 in the US, 108 in India) " +
          "or go to the nearest emergency room immediately. Do not wait for a callback.",
      });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
