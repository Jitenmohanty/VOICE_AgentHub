import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
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
- Scheduling and managing appointments
- Basic symptom pre-screening (NOT diagnosis)
- Medication reminder information
- Insurance and billing FAQs
- Clinic information

IMPORTANT: Always clarify you are an AI assistant, not a doctor. Emergency protocol: ${emergencyProtocol}. Never diagnose conditions.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "checkDoctorAvailability",
      description: "Check available appointment slots",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Preferred date (YYYY-MM-DD)" },
          doctorName: { type: "string", description: "Preferred doctor name" },
        },
        required: ["date"],
      },
    },
    {
      name: "scheduleAppointment",
      description: "Schedule an appointment for the patient",
      parameters: {
        type: "object",
        properties: {
          patientName: { type: "string", description: "Patient name" },
          date: { type: "string", description: "Appointment date" },
          time: { type: "string", description: "Appointment time" },
          reason: { type: "string", description: "Reason for visit" },
        },
        required: ["patientName", "date", "time"],
      },
    },
    {
      name: "flagEmergency",
      description: "Flag an emergency and provide emergency instructions",
      parameters: {
        type: "object",
        properties: {
          symptoms: { type: "string", description: "Reported symptoms" },
        },
        required: ["symptoms"],
      },
    },
  ];
}

export function handleToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "checkDoctorAvailability":
      return JSON.stringify({ slots: [{ time: "10:00 AM", doctor: "Dr. Smith" }, { time: "2:30 PM", doctor: "Dr. Johnson" }] });
    case "scheduleAppointment":
      return JSON.stringify({ appointmentId: `APT-${Date.now()}`, confirmed: true, date: args.date, time: args.time });
    case "flagEmergency":
      return JSON.stringify({ action: "EMERGENCY", message: "Please call 911 immediately. Stay on the line if possible." });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
