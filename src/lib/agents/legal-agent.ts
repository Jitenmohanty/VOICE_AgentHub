import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig, _extra?: Record<string, string>): string {
  const firmName = (config.firmName as string) || "";
  const jurisdiction = (config.jurisdiction as string) || "United States";
  const legalArea = (config.legalArea as string) || "General";
  const additionalAreas = Array.isArray(config.additionalAreas) ? config.additionalAreas.join(", ") : "";
  const consultationType = (config.consultationType as string) || "Free Initial";
  const consultationFee = (config.consultationFee as string) || "";
  const availableDays = Array.isArray(config.availableDays) ? config.availableDays.join(", ") : "Monday - Friday";
  const openTime = (config.openTime as string) || "9:00 AM";
  const closeTime = (config.closeTime as string) || "6:00 PM";
  const disclaimerText = (config.disclaimerText as string) || "This service provides general legal information only, not legal advice.";
  const documentTypes = Array.isArray(config.documentTypes) ? config.documentTypes.join(", ") : "";
  const proBonoAvailable = !!config.proBonoAvailable;

  return `You are a legal information assistant${firmName ? ` for ${firmName}` : ""} specializing in ${legalArea} law in ${jurisdiction}${additionalAreas ? `. Also covers: ${additionalAreas}` : ""}.

Office Details:
- Available: ${availableDays}, ${openTime} - ${closeTime}
- Consultation: ${consultationType}${consultationFee ? ` — ${consultationFee}` : ""}
${documentTypes ? `- Document Support: ${documentTypes}` : ""}
${proBonoAvailable ? "- Pro bono services available for qualifying cases" : ""}

You help callers with:
- Explaining legal terms and procedures in plain language
- Describing the firm's practice areas, hours, and consultation options
- General orientation on legal processes (NOT advice on their specific case)

You DO NOT:
- Schedule consultations yourself — use captureLead and an attorney will call back
- Draft documents during the call — capture the lead with the document type
- Provide case-specific legal advice or predict outcomes

CRITICAL DISCLAIMER: ${disclaimerText} Always recommend consulting a licensed attorney for the caller's specific situation. Never guarantee outcomes. If the caller appears to have a time-sensitive matter (deadline, court date, arrest), capture the lead with high urgency.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  // Legal info doesn't need data-fetch tools — the LLM can explain terms,
  // procedures, and general orientation directly. The only tool needed is
  // captureLead, which is appended universally in agent-prompts.ts.
  return [];
}

export function handleToolCall(_name: string, _args: Record<string, unknown>, _agentId?: string): string {
  return JSON.stringify({ error: "Unknown tool" });
}
