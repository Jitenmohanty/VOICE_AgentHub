export interface TranscriptMessage {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: Date;
}

export interface AgentSessionData {
  id: string;
  agentType: string;
  title: string | null;
  config: Record<string, unknown>;
  transcript: TranscriptMessage[];
  summary: string | null;
  duration: number | null;
  rating: number | null;
  feedback: string | null;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}
