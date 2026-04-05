import { z } from "zod";
import { TEMPLATES } from "@/lib/templates";

const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as [string, ...string[]];

// ── Reusable primitives ─────────────────────────────────────────────────────

const safeString = (max: number) =>
  z.string().max(max, `Must be ${max} characters or fewer`).trim();

// ── Public: POST /api/public/agent/[slug]/session ───────────────────────────

export const CandidateContextSchema = z.object({
  name: safeString(100).optional(),
  techStack: safeString(500).optional(),
  level: z.enum(["Junior", "Mid", "Senior", "Lead", "Principal"]).optional(),
  targetRole: safeString(200).optional(),
  resumeSkills: safeString(1000).optional(),
  resumeSummary: safeString(600).optional(),
});

export const SessionCreateSchema = z.object({
  candidateContext: CandidateContextSchema.optional(),
  callContext: safeString(500).optional(),
  callerName: safeString(100).optional(),
  callerPhone: z
    .string()
    .max(20)
    .regex(/^[+\d\s\-()]*$/, "Invalid phone format")
    .optional(),
});

// ── Public: PATCH /api/public/agent/[slug]/session/[sessionId] ──────────────

const TranscriptMessageSchema = z.object({
  speaker: z.enum(["user", "agent"]),
  text: safeString(2000),
  timestamp: z.string().optional(),
});

export const SessionPatchSchema = z.object({
  title: safeString(200).optional(),
  transcript: z.array(TranscriptMessageSchema).max(500).optional(),
  summary: safeString(2000).optional(),
  duration: z.number().int().min(0).max(600).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: safeString(1000).optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  interviewData: z
    .object({
      scores: z
        .array(
          z.object({
            round: z.number().int().min(1).max(5),
            questionNumber: z.number().int().min(1).optional(),
            question: safeString(500).optional(),
            answerSummary: safeString(500).optional(),
            score: z.number().min(0).max(10),
            feedback: safeString(500).optional(),
          }),
        )
        .max(100)
        .optional(),
      rounds: z
        .array(
          z.object({
            round: z.number().int().min(1).max(5),
            summary: safeString(500).optional(),
          }),
        )
        .max(10)
        .optional(),
      result: z
        .object({
          overallImpression: z.enum(["strong", "average", "needs_work"]).optional(),
          overallFeedback: safeString(1000).optional(),
        })
        .optional(),
    })
    .optional(),
});

// ── Public: POST /api/public/agent/[slug]/session — rating update ───────────

export const SessionRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: safeString(1000).optional(),
});

// ── Auth: POST /api/auth/register ───────────────────────────────────────────

export const RegisterSchema = z.object({
  name: safeString(100).optional(),
  email: z.string().email("Invalid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  businessName: safeString(100).min(1, "Business name is required"),
  industry: z.enum(TEMPLATE_IDS, {
    error: "Invalid industry template",
  }),
});

// ── Auth: POST /api/auth/forgot-password ────────────────────────────────────

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").max(254),
});

// ── Auth: POST /api/auth/reset-password ─────────────────────────────────────

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

// ── Internal: POST /api/internal/post-call ──────────────────────────────────

export const PostCallSchema = z.object({
  sessionId: z.string().cuid("Invalid session ID"),
});
