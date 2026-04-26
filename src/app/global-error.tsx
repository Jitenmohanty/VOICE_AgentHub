"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0A0A0F",
          color: "#F0F0F5",
          fontFamily:
            "'Helvetica Neue', Arial, sans-serif, system-ui",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: "0 0 12px",
              letterSpacing: "-0.5px",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#8888AA", fontSize: 15, lineHeight: 1.6 }}>
            We&apos;ve been notified and are looking into it. Please try again.
          </p>
          {error.digest ? (
            <p
              style={{
                color: "#555577",
                fontSize: 12,
                fontFamily: "monospace",
                marginTop: 16,
              }}
            >
              Error ID: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
