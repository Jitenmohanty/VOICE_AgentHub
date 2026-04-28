import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow third-party sites to iframe ONLY the embed widget. The rest
        // of the app stays default (browsers block framing without an
        // explicit allowance via CSP frame-ancestors).
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project — only consumed by source map upload (no-ops without an
  // auth token, so the build still works without these set).
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Reduce noise during local builds; CI/Vercel will print upload status.
  silent: !process.env.CI,

  // Route Sentry's monitoring requests through your own host to dodge
  // ad-blockers that block direct sentry.io traffic.
  tunnelRoute: "/monitoring",

  // Tree-shake out the Sentry logger in production bundles.
  disableLogger: true,

  // Only attempt source-map upload when an auth token is present, so dev
  // builds (and Vercel previews without the secret set) don't fail.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
