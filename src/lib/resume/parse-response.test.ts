import { describe, it, expect } from "vitest";
import {
  parseResumeAnalysis,
  RESUME_TEXT_MARKER,
  SKILLS_MAX,
  SUMMARY_MAX,
  RESUME_TEXT_MAX,
} from "./parse-response";

const json = (o: Record<string, unknown>) => JSON.stringify(o);

describe("parseResumeAnalysis", () => {
  it("parses the happy path: JSON metadata + marker + full text", () => {
    const raw = `${json({
      name: "Alex Johnson",
      skills: "TypeScript, React, Node.js",
      summary: "Alex has 5 years of experience.",
    })}\n${RESUME_TEXT_MARKER}\nEXPERIENCE\nAcme Corp — Senior Engineer (2020-2024)`;

    const out = parseResumeAnalysis(raw);
    expect(out.name).toBe("Alex Johnson");
    expect(out.skills).toBe("TypeScript, React, Node.js");
    expect(out.summary).toBe("Alex has 5 years of experience.");
    expect(out.resumeText).toContain("Acme Corp — Senior Engineer");
    expect(out.resumeText).not.toContain(RESUME_TEXT_MARKER);
  });

  it("strips a ```json markdown fence around the metadata (the main untested risk)", () => {
    const raw = `\`\`\`json\n${json({
      name: "Sam",
      skills: "Go, Kubernetes",
      summary: "Sam is a platform engineer.",
    })}\n\`\`\`\n${RESUME_TEXT_MARKER}\nSkills: Go`;

    const out = parseResumeAnalysis(raw);
    expect(out.name).toBe("Sam");
    expect(out.skills).toBe("Go, Kubernetes");
    expect(out.summary).toBe("Sam is a platform engineer.");
    expect(out.resumeText).toBe("Skills: Go");
  });

  it("handles a missing marker: whole thing is JSON, resumeText empty", () => {
    const raw = json({ name: "Riya", skills: "Python", summary: "ML engineer." });
    const out = parseResumeAnalysis(raw);
    expect(out.name).toBe("Riya");
    expect(out.skills).toBe("Python");
    expect(out.resumeText).toBe("");
  });

  it("falls back to skills when the JSON is malformed (never throws)", () => {
    const raw = `not json at all, just prose about the candidate`;
    const out = parseResumeAnalysis(raw);
    expect(out.name).toBe("");
    expect(out.summary).toBe("");
    expect(out.skills).toBe("not json at all, just prose about the candidate");
  });

  it("caps skills at SKILLS_MAX even in the fallback (prevents a downstream 400)", () => {
    const raw = "x".repeat(5000); // invalid JSON → dumped into skills
    const out = parseResumeAnalysis(raw);
    expect(out.skills.length).toBe(SKILLS_MAX);
  });

  it("caps summary and resumeText to their schema-mirrored maxima", () => {
    const raw = `${json({
      name: "Cap Test",
      skills: "a",
      summary: "s".repeat(2000),
    })}\n${RESUME_TEXT_MARKER}\n${"r".repeat(20000)}`;

    const out = parseResumeAnalysis(raw);
    expect(out.summary.length).toBe(SUMMARY_MAX);
    expect(out.resumeText.length).toBe(RESUME_TEXT_MAX);
  });

  it("is robust to empty / whitespace / non-string input", () => {
    expect(parseResumeAnalysis("")).toEqual({ name: "", skills: "", summary: "", resumeText: "" });
    expect(parseResumeAnalysis("   ")).toEqual({ name: "", skills: "", summary: "", resumeText: "" });
    // @ts-expect-error — guarding the runtime path against a null response
    expect(parseResumeAnalysis(null)).toEqual({ name: "", skills: "", summary: "", resumeText: "" });
  });

  it("tolerates the marker with no trailing text", () => {
    const raw = `${json({ name: "No Text", skills: "x", summary: "y" })}\n${RESUME_TEXT_MARKER}`;
    const out = parseResumeAnalysis(raw);
    expect(out.name).toBe("No Text");
    expect(out.resumeText).toBe("");
  });
});
