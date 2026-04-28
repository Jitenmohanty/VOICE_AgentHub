import { inngest } from "@/inngest/client";
import { getAppUrl } from "@/lib/url";

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

      // Fallback: direct HTTP call (fire-and-forget). Requires INTERNAL_API_SECRET.
      const secret = process.env.INTERNAL_API_SECRET;
      if (!secret) {
        console.error("[PostCall] INTERNAL_API_SECRET not set — cannot fall back to HTTP. Session will not be analyzed:", sessionId);
        return;
      }
      const url = `${baseUrl ?? getAppUrl()}/api/internal/post-call`;

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": secret,
        },
        body: JSON.stringify({ sessionId }),
      }).catch((fetchErr) => {
        console.warn("[PostCall] Fallback HTTP call also failed:", fetchErr);
      });
    });
}
