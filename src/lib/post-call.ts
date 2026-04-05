import { inngest } from "@/inngest/client";

/**
 * Trigger post-call analysis via Inngest (durable, retried, observable).
 * Falls back to direct HTTP if Inngest is not configured.
 */
export function triggerPostCallAnalysis(sessionId: string, baseUrl?: string): void {
  // Send to Inngest job queue — 3 auto-retries, visible in Inngest dashboard
  inngest
    .send({ name: "session/post-call", data: { sessionId } })
    .catch((err) => {
      console.warn("[PostCall] Inngest send failed, falling back to direct call:", err);

      // Fallback: direct HTTP call (fire-and-forget, same as before)
      const secret = process.env.INTERNAL_API_SECRET;
      const url = baseUrl
        ? `${baseUrl}/api/internal/post-call`
        : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/internal/post-call`;

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-internal-secret": secret } : {}),
        },
        body: JSON.stringify({ sessionId }),
      }).catch((fetchErr) => {
        console.warn("[PostCall] Fallback HTTP call also failed:", fetchErr);
      });
    });
}
