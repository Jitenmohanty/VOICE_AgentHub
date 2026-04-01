import Anthropic from "@anthropic-ai/sdk";
import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import type { TranscriptMessage } from "@/types/session";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    // wrapSDK auto-traces all Claude API calls to LangSmith
    client = wrapSDK(new Anthropic({ apiKey }));
  }
  return client;
}

export interface PostCallAnalysis {
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  sentimentScore: number;
  actionItems: { action: string; priority: "high" | "medium" | "low" }[];
  topics: string[];
  escalated: boolean;
}

/** Generate post-call analysis using Claude (traced via LangSmith) */
export const generatePostCallAnalysis = traceable(
  async function generatePostCallAnalysis(
    agentName: string,
    transcript: TranscriptMessage[],
  ): Promise<PostCallAnalysis> {
    if (transcript.length === 0) {
      return {
        summary: "No conversation recorded.",
        sentiment: "neutral",
        sentimentScore: 0,
        actionItems: [],
        topics: [],
        escalated: false,
      };
    }

    const formatted = transcript
      .map((m) => `${m.speaker === "user" ? "Customer" : "Agent"}: ${m.text}`)
      .join("\n");

    const claude = getClient();
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this voice conversation between a customer and "${agentName}" AI agent. Return ONLY valid JSON (no markdown, no code fences).

Conversation:
${formatted}

Return this exact JSON structure:
{
  "summary": "2-3 sentence summary of what was discussed and resolved",
  "sentiment": "positive" or "neutral" or "negative" or "mixed",
  "sentimentScore": number from -1.0 (very negative) to 1.0 (very positive),
  "actionItems": [{"action": "description", "priority": "high/medium/low"}],
  "topics": ["topic1", "topic2"],
  "escalated": true/false (whether customer needed human help)
}`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    try {
      return JSON.parse(text) as PostCallAnalysis;
    } catch {
      return {
        summary: text || "Analysis failed.",
        sentiment: "neutral",
        sentimentScore: 0,
        actionItems: [],
        topics: [],
        escalated: false,
      };
    }
  },
  { name: "generatePostCallAnalysis", run_type: "chain" },
);

/** Use Claude to chunk a document into titled sections (traced) */
export const chunkDocument = traceable(
  async function chunkDocument(
    content: string,
  ): Promise<{ title: string; content: string }[]> {
    const claude = getClient();
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Split this document into logical sections for a knowledge base. Return ONLY valid JSON array (no markdown). Each section should be self-contained and searchable.

Document:
${content.slice(0, 10000)}

Return: [{"title": "Section Title", "content": "section content..."}]`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "[]";

    try {
      return JSON.parse(text) as { title: string; content: string }[];
    } catch {
      return [{ title: "Document", content: content.slice(0, 5000) }];
    }
  },
  { name: "chunkDocument", run_type: "chain" },
);
/* ── Interview Report ─────────────────────────── */

export interface InterviewScore {
  round: number;
  questionNumber?: number;
  question?: string;
  answerSummary?: string;
  score: number;
  feedback?: string;
}

export interface InterviewSessionData {
  scores: InterviewScore[];
  rounds: { round: number; summary?: string }[];
  result: { overallImpression?: string; overallFeedback?: string } | null;
}

export interface InterviewCandidateContext {
  name?: string;
  techStack?: string;
  level?: string;
  targetRole?: string;
}

export interface InterviewReport {
  overallScore: number; // 0-100
  verdict: "strong" | "average" | "needs_work";
  summary: string;
  roundBreakdown: {
    round: number;
    roundName: string;
    score: number;
    comments: string;
  }[];
  communicationFeedback: string;
  technicalStrengths: string[];
  technicalWeaknesses: string[];
  areasToImprove: string[];
  recommendedResources: string[];
}

/** Generate a detailed interview report using Claude (traced via LangSmith) */
export const generateInterviewReport = traceable(
  async function generateInterviewReport(
    transcript: TranscriptMessage[],
    interviewData: InterviewSessionData,
    candidateContext: InterviewCandidateContext,
  ): Promise<InterviewReport> {
    const formatted = transcript
      .map((m) => `${m.speaker === "user" ? "Candidate" : "Interviewer"}: ${m.text}`)
      .join("\n");

    const scoresStr = interviewData.scores
      .map((s) => `Round ${s.round}${s.questionNumber ? ` Q${s.questionNumber}` : ""}: ${s.score}/10${s.feedback ? ` — ${s.feedback}` : ""}`)
      .join("\n");

    const claude = getClient();
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze this mock technical interview and generate a detailed report. Return ONLY valid JSON (no markdown, no code fences).

Candidate: ${candidateContext.name || "Unknown"}
Tech Stack: ${candidateContext.techStack || "General"}
Level: ${candidateContext.level || "Mid"}
Target Role: ${candidateContext.targetRole || "Software Engineer"}

Interview Scores (from AI interviewer):
${scoresStr}

Overall Impression: ${interviewData.result?.overallImpression || "not recorded"}
Interviewer Feedback: ${interviewData.result?.overallFeedback || "none"}

Full Transcript:
${formatted.slice(0, 12000)}

Return this exact JSON structure:
{
  "overallScore": <number 0-100>,
  "verdict": "strong" | "average" | "needs_work",
  "summary": "<2-3 sentence overall assessment>",
  "roundBreakdown": [
    {"round": 1, "roundName": "Introduction", "score": <1-10>, "comments": "<feedback>"},
    {"round": 2, "roundName": "Core Language", "score": <1-10>, "comments": "<feedback>"}
  ],
  "communicationFeedback": "<feedback on clarity, confidence, filler words, pace>",
  "technicalStrengths": ["strength 1", "strength 2"],
  "technicalWeaknesses": ["weakness 1", "weakness 2"],
  "areasToImprove": ["specific area 1", "specific area 2"],
  "recommendedResources": ["resource or topic to study"]
}`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    try {
      return JSON.parse(text) as InterviewReport;
    } catch {
      // Fallback: compute from raw scores
      const avgScore = interviewData.scores.length > 0
        ? interviewData.scores.reduce((s, q) => s + q.score, 0) / interviewData.scores.length
        : 5;
      return {
        overallScore: Math.round(avgScore * 10),
        verdict: avgScore >= 7 ? "strong" : avgScore >= 5 ? "average" : "needs_work",
        summary: text || "Report generation encountered an issue. Please review the transcript manually.",
        roundBreakdown: [],
        communicationFeedback: "",
        technicalStrengths: [],
        technicalWeaknesses: [],
        areasToImprove: [],
        recommendedResources: [],
      };
    }
  },
  { name: "generateInterviewReport", run_type: "chain" },
);