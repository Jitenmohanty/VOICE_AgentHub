import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
  const jurisdiction = (config.jurisdiction as string) || "United States";
  const legalArea = (config.legalArea as string) || "General";

  return `You are a legal information assistant specializing in ${legalArea} law in ${jurisdiction}. You provide:
- General legal information and term explanations
- Procedural guidance (how to file, deadlines, requirements)
- Document drafting assistance (basic templates)
- FAQ on common legal questions

CRITICAL DISCLAIMER: Always state you provide general information only, not legal advice. Recommend consulting a licensed attorney for specific cases. Never guarantee outcomes.
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
