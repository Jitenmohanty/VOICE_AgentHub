import type { TranscriptMessage } from "@/types/session";

/**
 * Generate a session title from agent name + first user message.
 * e.g. "Hotel Concierge — Room availability inquiry"
 */
export function generateSessionTitle(
  agentName: string,
  transcript: TranscriptMessage[],
): string {
  const firstUserMsg = transcript.find((m) => m.speaker === "user");
  if (!firstUserMsg) return `${agentName} Session`;

  const topic = firstUserMsg.text.trim();
  const short = topic.length > 50 ? topic.slice(0, 50).trimEnd() + "…" : topic;
  return `${agentName} — ${short}`;
}

/**
 * Generate a conversation summary from transcript data.
 * No AI API needed — built from message stats and content.
 */
export function generateSessionSummary(
  agentName: string,
  transcript: TranscriptMessage[],
  durationSec: number,
): string {
  if (transcript.length === 0) return "";

  const userMsgs = transcript.filter((m) => m.speaker === "user");
  const agentMsgs = transcript.filter((m) => m.speaker === "agent");
  const total = transcript.length;

  const parts: string[] = [];

  // Duration + message count
  const dur = durationSec > 0 ? formatDur(durationSec) : "a brief";
  parts.push(
    `A ${dur} conversation with ${agentName} — ${total} message${total !== 1 ? "s" : ""} (${userMsgs.length} from you, ${agentMsgs.length} from the agent).`,
  );

  // What the user asked about
  if (userMsgs.length > 0) {
    const first = userMsgs[0]!.text.trim();
    const preview = first.length > 100 ? first.slice(0, 100).trimEnd() + "…" : first;
    parts.push(`You started by saying: "${preview}"`);
  }

  // Key topics from agent responses (pick longest agent message as main content)
  if (agentMsgs.length > 0) {
    const longest = agentMsgs.reduce((a, b) =>
      a.text.length > b.text.length ? a : b,
    );
    const snippet =
      longest.text.length > 120
        ? longest.text.slice(0, 120).trimEnd() + "…"
        : longest.text;
    parts.push(`Key response: "${snippet}"`);
  }

  return parts.join(" ");
}

function formatDur(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}
