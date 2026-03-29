export interface TranscriptMessage {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: Date;
}

export interface AgentSessionData {
  id: string;
  agentType: string;
  config: Record<string, unknown>;
  transcript: TranscriptMessage[];
  duration: number | null;
  rating: number | null;
  feedback: string | null;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}
