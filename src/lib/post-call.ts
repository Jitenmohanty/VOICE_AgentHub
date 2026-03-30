/**
 * Trigger post-call analysis asynchronously.
 * Fire-and-forget — doesn't block the response.
 */
export function triggerPostCallAnalysis(sessionId: string, baseUrl?: string): void {
  const url = baseUrl
    ? `${baseUrl}/api/internal/post-call`
    : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/internal/post-call`;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch((err) => {
    console.warn("[PostCall] Failed to trigger analysis:", err);
  });
}
