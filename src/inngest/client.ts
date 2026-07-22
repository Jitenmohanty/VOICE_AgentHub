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
  "knowledge/ingest-website": {
    data: { agentId: string; url: string };
  };
  // Durable embedding of a single knowledge item. Emitted whenever an item is
  // created or its content changes; processed by the embed-knowledge function
  // so a serverless response returning doesn't kill in-flight embedding work.
  "knowledge/embed-item": {
    data: { itemId: string; text: string };
  };
};
