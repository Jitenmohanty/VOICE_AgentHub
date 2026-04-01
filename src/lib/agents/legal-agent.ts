import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
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

You provide:
- General legal information and term explanations
- Procedural guidance (how to file, deadlines, requirements)
- Document drafting assistance (basic templates)
- FAQ on common legal questions

CRITICAL DISCLAIMER: ${disclaimerText} Recommend consulting a licensed attorney for specific cases. Never guarantee outcomes.
Keep responses concise and natural for voice conversation (2-3 sentences max).`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "getLegalTermDefinition",
      description: "Get the definition of a legal term",
      parameters: {
        type: "object",
        properties: {
          term: { type: "string", description: "Legal term to define" },
        },
        required: ["term"],
      },
    },
    {
      name: "getFilingProcedure",
      description: "Get filing procedure steps for a legal action",
      parameters: {
        type: "object",
        properties: {
          actionType: { type: "string", description: "Type of legal action" },
          jurisdiction: { type: "string", description: "Jurisdiction" },
        },
        required: ["actionType"],
      },
    },
    {
      name: "getDraftTemplate",
      description: "Get a basic document template",
      parameters: {
        type: "object",
        properties: {
          documentType: { type: "string", description: "Type of document", enum: ["nda", "contract", "letter", "complaint", "motion"] },
        },
        required: ["documentType"],
      },
    },
  ];
}

export function handleToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "getLegalTermDefinition":
      return JSON.stringify({ term: args.term, definition: "A legal concept referring to..." });
    case "getFilingProcedure":
      return JSON.stringify({ steps: ["Prepare documents", "File with clerk", "Serve opposing party", "Await response"] });
    case "getDraftTemplate":
      return JSON.stringify({ template: "Basic template for " + (args.documentType as string), note: "This is a general template. Consult an attorney." });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
