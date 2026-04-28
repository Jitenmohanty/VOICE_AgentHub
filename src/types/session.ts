export interface TranscriptMessage {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: Date;
}

export interface AgentSessionData {
  id: string;
  agentId: string | null;
  title: string | null;
  transcript: TranscriptMessage[];
  summary: string | null;
  duration: number | null;
  rating: number | null;
  feedback: string | null;
  status: "active" | "completed" | "cancelled";
  sentiment: string | null;
  sentimentScore: number | null;
  actionItems: unknown | null;
  topics: string[];
  escalated: boolean;
  callerName: string | null;
  callerPhone?: string | null;
  callerEmail?: string | null;
  capturedLead?: {
    name?: string;
    phone?: string;
    email?: string;
    intent: string;
    urgency?: "low" | "medium" | "high";
    notes?: string;
    capturedAt?: string;
  } | null;
  leadStatus?: "new" | "contacted" | "qualified" | "won" | "lost" | "archived";
  leadDeliveredAt?: Date | string | null;
  createdAt: Date;
  updatedAt: Date;

  // Populated via include in API queries
  agent?: {
    name: string;
    templateType: string;
    business?: { name: string };
  } | null;

  // Legacy fields (may exist on old sessions)
  agentType?: string | null;
}
