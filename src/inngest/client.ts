import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "agenthub",
  // In production set INNGEST_EVENT_KEY in env.
  // In dev, Inngest Dev Server (npx inngest-cli@latest dev) picks this up automatically.
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
});

// ── Typed events ─────────────────────────────────────────────────────────────

export type Events = {
  "session/post-call": {
    data: { sessionId: string };
  };
};
