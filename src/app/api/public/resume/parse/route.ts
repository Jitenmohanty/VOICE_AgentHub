import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * POST /api/public/resume/parse
 * Accepts a PDF resume upload, extracts text, and uses Claude to identify skills.
 * No authentication required (used by candidates on the public interview page).
 */
export async function POST(request: Request) {
  try {
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

    // Use Claude's PDF support (document type) to extract skills
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
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
              text: `Extract the key technical skills, programming languages, frameworks, and tools from this resume. Return ONLY a comma-separated list of skills (nothing else). Example: "JavaScript, React, Node.js, Python, PostgreSQL, Docker, AWS"`,
            },
          ],
        },
      ],
    });

    const skills =
      response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

    return NextResponse.json({ skills });
  } catch (error) {
    console.error("[Resume] Parse failed:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 },
    );
  }
}
