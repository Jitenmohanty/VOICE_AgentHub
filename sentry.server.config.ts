import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower in prod to control event volume; bumped in dev for visibility.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Don't ship the SDK's debug logs to the console.
  debug: false,

  environment: process.env.NODE_ENV,

  // No-op when DSN is missing so local dev doesn't error out.
  enabled: Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
});
