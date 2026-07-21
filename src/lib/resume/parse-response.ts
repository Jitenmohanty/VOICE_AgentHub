/**
 * Pure parsing of the Claude resume-analysis response.
 *
 * The prompt (see /api/public/resume/parse) asks Claude for TWO parts:
 *   PART 1 — a small JSON object { name, skills, summary }
 *   PART 2 — after the RESUME_TEXT_MARKER, a raw plaintext transcription
 *
 * Keeping the JSON small means it parses cleanly; the full resume text rides
 * as raw trailing text so multi-line content can't break JSON escaping.
 *
 * This function is deliberately dependency-free and pure so it can be unit
 * tested without the Anthropic SDK or Next.js request plumbing.
 */

export const RESUME_TEXT_MARKER = "---RESUME-TEXT---";

// Caps MUST mirror CandidateContextSchema in src/lib/schemas.ts so the values
// this returns always survive that route's zod validation (an oversized field
// would otherwise 400 the session-create request downstream).
export const SKILLS_MAX = 1000;
export const SUMMARY_MAX = 600;
export const RESUME_TEXT_MAX = 8000;

export interface ParsedResumeAnalysis {
  name: string;
  skills: string;
  summary: string;
  resumeText: string;
}

/**
 * Strip a surrounding markdown code fence (```json … ``` or ``` … ```) if the
 * model added one despite being told not to. Only touches a fence that wraps
 * the whole string — inline backticks are left alone.
 */
function stripCodeFences(input: string): string {
  const t = input.trim();
  if (!t.startsWith("```")) return t;
  return t
    .replace(/^```[a-zA-Z0-9]*\s*\n?/, "") // opening fence + optional lang tag
    .replace(/\n?```$/, "") // closing fence
    .trim();
}

/**
 * Parse Claude's raw text response into the four fields the client needs.
 * Never throws: malformed JSON degrades to a skills-only fallback, a missing
 * marker yields an empty resumeText, and every field is length-capped.
 */
export function parseResumeAnalysis(raw: string): ParsedResumeAnalysis {
  const text = (raw ?? "").trim();

  const markerIdx = text.indexOf(RESUME_TEXT_MARKER);
  const jsonPart = markerIdx === -1 ? text : text.slice(0, markerIdx).trim();
  const textPart =
    markerIdx === -1 ? "" : text.slice(markerIdx + RESUME_TEXT_MARKER.length).trim();

  let parsed: { name?: string; skills?: string; summary?: string } = {};
  try {
    parsed = JSON.parse(stripCodeFences(jsonPart));
  } catch {
    // Not valid JSON — treat the whole metadata part as a skills list so the
    // agent still gets *something*, but capped so it can't overflow the schema.
    parsed = { skills: stripCodeFences(jsonPart) };
  }

  return {
    name: (parsed.name || "").trim(),
    skills: (parsed.skills || "").slice(0, SKILLS_MAX).trim(),
    summary: (parsed.summary || "").slice(0, SUMMARY_MAX),
    resumeText: textPart.slice(0, RESUME_TEXT_MAX),
  };
}
