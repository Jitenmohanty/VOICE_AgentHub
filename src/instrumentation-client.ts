import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    // Fallback to plain SENTRY_DSN if it was inlined at build time.
    process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay only errors in prod to keep payload size sane.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  debug: false,
  environment: process.env.NODE_ENV,
  enabled: Boolean(
    process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  ),
});

// Ties client-side navigations to spans so traces span across route changes.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
