import Anthropic from "@anthropic-ai/sdk";
import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import type { TranscriptMessage } from "@/types/session";

let client: Anthropic | null = null;

/**
 * Parse JSON from an LLM response that may be wrapped in a ```json fence or
 * padded with prose, despite instructions to return raw JSON. Throws (like
 * JSON.parse) if no valid JSON can be recovered, so callers keep their
 * existing try/catch fallbacks.
 */
function parseLooseJson<T>(text: string): T {
  let t = text.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) t = fence[1].trim();
  if (t[0] !== "{" && t[0] !== "[") {
    const starts = [t.indexOf("{"), t.indexOf("[")].filter((i) => i >= 0);
    const start = starts.length ? Math.min(...starts) : -1;
    const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    if (start >= 0 && end > start) t = t.slice(start, end + 1);
  }
  return JSON.parse(t) as T;
}

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    // wrapSDK auto-traces all Claude API calls to LangSmith
    client = wrapSDK(new Anthropic({ apiKey }));
  }
  return client;
}

export const LEAD_INTENT_CATEGORIES = [
  "booking",
  "pricing",
  "support",
  "complaint",
  "information",
  "spam",
  "other",
] as const;
export type LeadIntentCategory = (typeof LEAD_INTENT_CATEGORIES)[number];

export interface PostCallAnalysis {
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  sentimentScore: number;
  actionItems: { action: string; priority: "high" | "medium" | "low" }[];
  topics: string[];
  escalated: boolean;
  // AI lead scoring — nullable so older callers of this fn and parse
  // fallbacks degrade gracefully.
  leadScore: number | null;
  intentCategory: LeadIntentCategory | null;
  suggestedReply: string | null;
}

/** Clamp/validate the lead-scoring fields Claude returns so bad JSON never reaches the DB. */
function normalizeLeadScoring(raw: Partial<PostCallAnalysis>): Pick<PostCallAnalysis, "leadScore" | "intentCategory" | "suggestedReply"> {
  const score =
    typeof raw.leadScore === "number" && Number.isFinite(raw.leadScore)
      ? Math.max(0, Math.min(100, Math.round(raw.leadScore)))
      : null;
  const category = LEAD_INTENT_CATEGORIES.includes(raw.intentCategory as LeadIntentCategory)
    ? (raw.intentCategory as LeadIntentCategory)
    : null;
  const reply =
    typeof raw.suggestedReply === "string" && raw.suggestedReply.trim().length > 0
      ? raw.suggestedReply.trim().slice(0, 500)
      : null;
  return { leadScore: score, intentCategory: category, suggestedReply: reply };
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
        leadScore: null,
        intentCategory: null,
        suggestedReply: null,
      };
    }

    const formatted = transcript
      .map((m) => `${m.speaker === "user" ? "Customer" : "Agent"}: ${m.text}`)
      .join("\n");

    const claude = getClient();
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
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
  "escalated": true/false (whether customer needed human help),
  "leadScore": integer 0-100 rating this caller's value as a sales lead for the business:
    90-100 = ready to transact now AND left contact details;
    70-89 = clear transactional intent (wants to book/order/schedule);
    40-69 = genuine interest, worth a follow-up;
    10-39 = casual inquiry, low buying signal;
    0-9 = no lead value (wrong number, test call, spam),
  "intentCategory": exactly one of "booking" | "pricing" | "support" | "complaint" | "information" | "spam" | "other" — the caller's PRIMARY intent,
  "suggestedReply": a short, friendly SMS/WhatsApp-style follow-up message (max 300 characters) the business owner could send this caller, written in first person from the business and referencing what the caller asked for. Use null if the caller left no lead or follow-up makes no sense.
}`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    try {
      const parsed = parseLooseJson<PostCallAnalysis>(text);
      return { ...parsed, ...normalizeLeadScoring(parsed) };
    } catch {
      return {
        summary: text || "Analysis failed.",
        sentiment: "neutral",
        sentimentScore: 0,
        actionItems: [],
        topics: [],
        escalated: false,
        leadScore: null,
        intentCategory: null,
        suggestedReply: null,
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
      model: "claude-sonnet-4-6",
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
      return parseLooseJson<{ title: string; content: string }[]>(text);
    } catch {
      return [{ title: "Document", content: content.slice(0, 5000) }];
    }
  },
  { name: "chunkDocument", run_type: "chain" },
);
/* ── Weekly Digest (Item 2) ───────────────────── */

export interface WeeklyDigestStats {
  businessName: string;
  totalCalls: number;
  completedCalls: number;
  leadsCaptured: number;
  wonLeads: number;
  avgDurationSeconds: number;
  topTopics: string[];
  hotLeadCount: number; // leadScore >= 70
  gaps: { query: string; hits: number }[];
}

export interface WeeklyDigestContent {
  narrative: string; // 2-4 sentence week-in-review, plain text
  gapAdvice: string; // one sentence telling the owner what to add first
}

/**
 * Claude turns the week's raw stats into a short owner-friendly narrative.
 * Pure formatting fallback if the API is unavailable — the digest email
 * still goes out, just without the AI phrasing.
 */
export const generateWeeklyDigest = traceable(
  async function generateWeeklyDigest(stats: WeeklyDigestStats): Promise<WeeklyDigestContent> {
    const fallback: WeeklyDigestContent = {
      narrative: `Your agent handled ${stats.totalCalls} calls this week and captured ${stats.leadsCaptured} leads.`,
      gapAdvice:
        stats.gaps.length > 0
          ? `Callers asked about "${stats.gaps[0]!.query}" and your agent had no answer — consider adding it to your knowledge base.`
          : "",
    };
    if (!process.env.ANTHROPIC_API_KEY) return fallback;

    try {
      const claude = getClient();
      const response = await claude.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `You write a weekly performance digest for a small business owner using an AI voice agent. Be concrete, encouraging, and brief. Return ONLY valid JSON (no markdown).

This week's data for "${stats.businessName}":
- Total calls: ${stats.totalCalls} (${stats.completedCalls} completed)
- Leads captured: ${stats.leadsCaptured} (${stats.hotLeadCount} scored hot, ${stats.wonLeads} marked won)
- Average call length: ${Math.round(stats.avgDurationSeconds)}s
- Top topics: ${stats.topTopics.join(", ") || "none"}
- Unanswered caller questions (knowledge gaps): ${
              stats.gaps.map((g) => `"${g.query}" (asked ${g.hits}x)`).join("; ") || "none"
            }

Return: {"narrative": "<2-4 sentences summarizing the week, highlighting what changed or stands out>", "gapAdvice": "<1 sentence telling the owner the single most valuable FAQ to add next, referencing the gap questions; empty string if there are no gaps>"}`,
          },
        ],
      });
      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      const parsed = parseLooseJson<Partial<WeeklyDigestContent>>(text);
      return {
        narrative: typeof parsed.narrative === "string" && parsed.narrative ? parsed.narrative : fallback.narrative,
        gapAdvice: typeof parsed.gapAdvice === "string" ? parsed.gapAdvice : fallback.gapAdvice,
      };
    } catch {
      return fallback;
    }
  },
  { name: "generateWeeklyDigest", run_type: "chain" },
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
      model: "claude-sonnet-4-6",
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
      return parseLooseJson<InterviewReport>(text);
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