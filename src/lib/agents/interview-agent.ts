import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig): string {
  const techStack = Array.isArray(config.techStack) ? config.techStack.join(", ") : "General";
  const level = (config.level as string) || "Mid";
  const company = (config.company as string) || "general";
  const yearsExperience = config.yearsExperience ? String(config.yearsExperience) : "";
  const interviewStyle = (config.interviewStyle as string) || "Mixed";
  const questionTypes = Array.isArray(config.questionTypes) ? config.questionTypes.join(", ") : "Coding, System Design, Behavioral";
  const difficultyLevel = (config.difficultyLevel as string) || "Adaptive (auto-adjust)";
  const totalRounds = config.totalRounds ? String(config.totalRounds) : "5";
  const includeSystemDesign = config.includeSystemDesign !== false;
  const includeBehavioral = config.includeBehavioral !== false;
  const feedbackStyle = (config.feedbackStyle as string) || "After Each Question";
  const scoringEnabled = config.scoringEnabled !== false;
  const communicationFeedback = config.communicationFeedback !== false;
  const customInstructions = (config.customInstructions as string) || "";

  return `You are a senior tech interview coach. The candidate's profile:
- Tech Stack: ${techStack}
- Level: ${level}${yearsExperience ? ` (${yearsExperience} years experience)` : ""}
- Target: ${company}
- Interview Style: ${interviewStyle}
- Question Types: ${questionTypes}
- Difficulty: ${difficultyLevel}
- Questions per Session: ${totalRounds}

Session Rules:
1. Conduct mock interviews covering: ${questionTypes}
2. Ask one question at a time, wait for the answer
${scoringEnabled ? "3. After each answer: rate it (1-10), explain what was good, what to improve" : "3. After each answer: explain what was good and what to improve"}
${difficultyLevel === "Adaptive (auto-adjust)" ? "4. Adjust difficulty based on performance" : `4. Keep difficulty at ${difficultyLevel} level`}
5. Track progress across the session — aim for ${totalRounds} questions total
${communicationFeedback ? "6. Give communication feedback: filler words, confidence, structure (STAR method)" : ""}
${includeSystemDesign ? "7. Include at least one system design question" : ""}
${includeBehavioral ? "8. Include at least one behavioral question using STAR method" : ""}

Feedback Style: ${feedbackStyle}
${customInstructions ? `\nSpecial Instructions: ${customInstructions}` : ""}

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
