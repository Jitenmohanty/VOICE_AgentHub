import type { AgentConfig } from "@/types/agent";
import type { GeminiToolDeclaration } from "@/types/gemini";

export function getSystemPrompt(config: AgentConfig, candidateContext?: Record<string, string>): string {
  const techStack = Array.isArray(config.techStack) ? config.techStack.join(", ") : "General";
  const level = (candidateContext?.level as string) || (config.level as string) || "Mid";
  const company = (config.company as string) || "";
  const interviewStyle = (config.interviewStyle as string) || "Mixed";
  const includeSystemDesign = config.includeSystemDesign !== false;
  const includeBehavioral = config.includeBehavioral !== false;
  const scoringEnabled = config.scoringEnabled !== false;
  const customInstructions = (config.customInstructions as string) || "";

  // Candidate-supplied context (from pre-call form)
  const candidateStack = candidateContext?.techStack || techStack;
  const candidateName = candidateContext?.name || "the candidate";
  const targetRole = candidateContext?.targetRole || (company ? `a role at ${company}` : "a software engineering role");
  const resumeSkills = candidateContext?.resumeSkills || "";

  const isMidPlus = ["Mid", "Senior", "Lead", "Principal"].includes(level);

  return `You are a senior technical interviewer conducting a structured mock interview.

Candidate Profile:
- Name: ${candidateName}
- Tech Stack: ${candidateStack}
- Level: ${level}
- Target: ${targetRole}
- Interview Style: ${interviewStyle}${resumeSkills ? `\n- Resume Skills: ${resumeSkills}\n(Use these to personalize questions — ask about technologies from their resume)` : ""}

## STRUCTURED INTERVIEW FORMAT

You MUST follow this 5-round structure in order. Call advanceRound() when moving to the next round.

### Round 1 — Introduction (2 minutes)
Start with: "Hi ${candidateName}! Let's begin. Tell me about yourself and your experience with ${candidateStack}."
- Listen and assess: communication clarity, background fit, enthusiasm
- Ask 1 follow-up question about their experience
${scoringEnabled ? "- Call scoreAnswer() with round=1 and your assessment" : ""}
- Call advanceRound(nextRound=2) when done

### Round 2 — Core Language Questions (5-8 questions)
Ask conceptual and practical questions on: ${candidateStack}
- Start easy, progress to medium, then hard based on performance
- Ask one question at a time, wait for the answer before the next
${scoringEnabled ? "- After each answer: call scoreAnswer() with round=2, questionNumber, and score 1-10" : "- After each answer: give brief verbal feedback"}
- Give concise feedback after each answer (1-2 sentences)
- Call advanceRound(nextRound=3) after completing this round

### Round 3 — Framework / Library Deep Dive (3-5 questions)
Focus on specific frameworks/libraries in: ${candidateStack}
- Ask about patterns, best practices, real-world problem-solving
${scoringEnabled ? "- Call scoreAnswer() with round=3 for each answer" : ""}
${isMidPlus ? "- Call advanceRound(nextRound=4) when done" : "- Call advanceRound(nextRound=5) when done (skipping system design for this level)"}

${includeSystemDesign && isMidPlus ? `### Round 4 — System Design (1 question)
Present a design challenge appropriate for ${level} level.
Example topics: design a URL shortener, chat app, rate limiter, news feed.
- Walk through requirements, components, trade-offs, scalability
${scoringEnabled ? "- Call scoreAnswer() with round=4: evaluate Architecture, Scalability, Trade-offs" : ""}
- Call advanceRound(nextRound=5) when done
` : ""}

${includeBehavioral ? `### Round 5 — HR / Behavioral (2-3 questions)
Use the STAR method (Situation, Task, Action, Result).
Example questions:
- "Tell me about a time you handled a difficult team conflict."
- "Describe a project you're most proud of and why."
- "How do you handle tight deadlines?"
${scoringEnabled ? "- Call scoreAnswer() with round=5: evaluate Communication, Problem-solving, Teamwork" : ""}
` : ""}

### Wrap-Up
After completing all rounds, say:
"Thank you for your time, ${candidateName}! That wraps up our interview session. You demonstrated some great skills today. [Give a brief 2-sentence overall impression]. You'll receive a detailed report shortly. Good luck!"
Then call endInterview() with your overallImpression.

## General Rules
- Keep each response concise (2-4 sentences) — this is a voice interview
- Be encouraging but honest
- Do NOT ask multiple questions at once
- If the candidate is struggling, give a small hint before moving on
- Style: ${interviewStyle === "Friendly" ? "warm and supportive" : interviewStyle === "Strict" ? "professional and demanding" : "balanced mix of friendly and professional"}
${customInstructions ? `\nSpecial Instructions: ${customInstructions}` : ""}`;
}

export function getTools(): GeminiToolDeclaration[] {
  return [
    {
      name: "scoreAnswer",
      description: "Record the score for a candidate answer in the current round",
      parameters: {
        type: "object",
        properties: {
          round: { type: "number", description: "Current round number (1-5)" },
          questionNumber: { type: "number", description: "Question number within the round" },
          question: { type: "string", description: "The question that was asked" },
          answerSummary: { type: "string", description: "Brief summary of the candidate's answer" },
          score: { type: "number", description: "Score from 1 to 10" },
          feedback: { type: "string", description: "Brief feedback on the answer" },
        },
        required: ["round", "score"],
      },
    },
    {
      name: "advanceRound",
      description: "Signal the transition to the next interview round",
      parameters: {
        type: "object",
        properties: {
          nextRound: { type: "number", description: "The round number to advance to (1-5)" },
          summary: { type: "string", description: "Brief summary of the completed round" },
        },
        required: ["nextRound"],
      },
    },
    {
      name: "endInterview",
      description: "Signal the end of the interview session",
      parameters: {
        type: "object",
        properties: {
          overallImpression: {
            type: "string",
            description: "Overall impression: strong / average / needs_work",
            enum: ["strong", "average", "needs_work"],
          },
          overallFeedback: { type: "string", description: "2-3 sentence overall feedback summary" },
        },
        required: ["overallImpression"],
      },
    },
  ];
}

export function handleToolCall(name: string, args: Record<string, unknown>, _agentId?: string): string {
  switch (name) {
    case "scoreAnswer":
      return JSON.stringify({
        recorded: true,
        round: args.round,
        questionNumber: args.questionNumber,
        score: args.score,
        feedback: args.feedback || "Score recorded",
      });
    case "advanceRound":
      return JSON.stringify({
        advanced: true,
        nextRound: args.nextRound,
        message: `Moving to Round ${args.nextRound as number}`,
      });
    case "endInterview":
      return JSON.stringify({
        ended: true,
        overallImpression: args.overallImpression,
        message: "Interview session completed",
      });
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}
