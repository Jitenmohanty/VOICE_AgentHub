import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkResumeRateLimit } from "@/lib/ratelimit";

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

    const formData = await request.formData();
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

    // Use Claude's PDF support to extract a rich profile from the resume
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
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
              text: `Analyze this resume and return a JSON object with exactly these fields:
{
  "name": "Full name of the candidate (string, or empty string if not found)",
  "skills": "Comma-separated list of technical skills, languages, frameworks, tools",
  "summary": "3-5 sentence professional summary covering: total years of experience, most recent role/company, notable projects or achievements, and primary tech stack. Write in third person (e.g. 'Alex has 4 years...'). Keep it factual and based only on what is in the resume."
}
Return ONLY valid JSON, no markdown, no explanation.`,
            },
          ],
        },
      ],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";
    let parsed: { name?: string; skills?: string; summary?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: treat entire text as skills list (backward compat)
      parsed = { skills: raw };
    }

    // Cap summary at 600 chars to prevent system prompt bloat
    const summary = (parsed.summary || "").slice(0, 600);

    return NextResponse.json({
      name: parsed.name || "",
      skills: parsed.skills || "",
      summary,
    });
  } catch (error) {
    console.error("[Resume] Parse failed:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 },
    );
  }
}
