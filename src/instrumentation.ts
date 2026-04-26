import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captures errors thrown during server-side rendering, route handlers, and
// server actions and forwards them to Sentry. See Next.js instrumentation docs.
export const onRequestError = Sentry.captureRequestError;
