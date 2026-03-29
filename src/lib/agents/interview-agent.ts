import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
  const techStack = Array.isArray(config.techStack) ? config.techStack.join(", ") : "General";
  const level = (config.level as string) || "Mid";
  const company = (config.company as string) || "general";

  return `You are a senior tech interview coach. The candidate's profile:
- Tech Stack: ${techStack}
- Level: ${level}
- Target: ${company}

Your role:
1. Conduct mock interviews covering: coding concepts, system design, behavioral questions
2. Ask one question at a time, wait for the answer
3. After each answer: rate it (1-10), explain what was good, what to improve
4. Adjust difficulty based on performance
5. Track score across the session
6. Give communication feedback: filler words, confidence, structure (STAR method)
7. For coding questions, discuss approaches and trade-offs verbally

Be encouraging but honest. Use a conversational, professional tone.
Keep responses concise and natural for voice conversation.`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "getQuestionBank",
      description: "Get interview questions for a specific topic and difficulty",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Topic area", enum: ["coding", "system-design", "behavioral", "dsa"] },
          difficulty: { type: "string", description: "Difficulty level", enum: ["easy", "medium", "hard"] },
        },
        required: ["topic", "difficulty"],
      },
    },
    {
      name: "scoreAnswer",
      description: "Score a candidate's answer",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The question asked" },
          answerSummary: { type: "string", description: "Summary of the answer" },
          score: { type: "string", description: "Score 1-10" },
        },
        required: ["question", "score"],
      },
    },
  ];
}

export function handleToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "getQuestionBank":
      return JSON.stringify({ questions: [{ q: "Explain the virtual DOM in React", difficulty: args.difficulty }] });
    case "scoreAnswer":
      return JSON.stringify({ recorded: true, score: args.score, feedback: "Score recorded" });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
