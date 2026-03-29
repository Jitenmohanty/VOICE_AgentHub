import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
  const clinicName = (config.clinicName as string) || "Health Center";
  const specialty = (config.specialty as string) || "General";

  return `You are a medical reception assistant for ${clinicName} (${specialty}). You help with:
- Scheduling and managing appointments
- Basic symptom pre-screening (NOT diagnosis)
- Medication reminder information
- Insurance and billing FAQs
- Clinic information

IMPORTANT: Always clarify you are an AI assistant, not a doctor. For any emergency, immediately direct the patient to call emergency services (911). Never diagnose conditions.
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
