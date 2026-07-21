import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkResumeRateLimit } from "@/lib/ratelimit";
import { parseResumeAnalysis, RESUME_TEXT_MARKER } from "@/lib/resume/parse-response";

/**
 * POST /api/public/resume/parse
 * Accepts a PDF resume upload, extracts text, and uses Claude to identify skills.
 * No authentication required (used by candidates on the public interview page).
 */
export async function POST(request: Request) {
  try {
    // Rate limit: 5 parses/IP/min (Claude PDF parsing is expensive)
    const limited = await checkResumeRateLimit(request);
    if (limited) return limited;

    // A non-multipart body (wrong content-type) makes formData() throw — treat
    // that as a bad request, not a 500.
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Expected a multipart form upload" }, { status: 400 });
    }
    const file = formData.get("resume");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Resume parsing unavailable" }, { status: 503 });
    }

    const claude = new Anthropic({ apiKey });

    // Use Claude's PDF support to extract a rich profile + a full plaintext copy
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            {
              type: "text",
              text: `Analyze this resume. Respond in TWO parts, in this exact order:

PART 1 — a JSON object with exactly these fields (and nothing before it):
{
  "name": "Full name of the candidate (string, or empty string if not found)",
  "skills": "Comma-separated list of technical skills, languages, frameworks, tools",
  "summary": "3-5 sentence professional summary covering: total years of experience, most recent role/company, notable projects or achievements, and primary tech stack. Write in third person (e.g. 'Alex has 4 years...'). Keep it factual and based only on what is in the resume."
}

PART 2 — on a new line, the literal marker ${RESUME_TEXT_MARKER} followed by a clean plaintext transcription of the ENTIRE resume: every role with company and dates, education, projects, and bullet points. Preserve section headings and order. Do not summarize or omit anything in this part.

Return raw text only — no markdown code fences.`,
            },
          ],
        },
      ],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";

    // Split + validate the two-part response (JSON metadata + raw full text).
    // Pure, dependency-free, and unit-tested — see parse-response.test.ts.
    // Every field is length-capped to mirror CandidateContextSchema so the
    // values here can't 400 the downstream session-create request.
    const { name, skills, summary, resumeText } = parseResumeAnalysis(raw);

    return NextResponse.json({ name, skills, summary, resumeText });
  } catch (error) {
    console.error("[Resume] Parse failed:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 },
    );
  }
}
