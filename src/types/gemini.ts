export interface GeminiLiveConfig {
  model: string;
  systemInstruction: string;
  tools?: GeminiToolDeclaration[];
  responseModalities: string[];
}

export interface GeminiToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface GeminiToolCall {
  name: string;
  args: Record<string, unknown>;
}

// "reconnecting" = an abnormal mid-call socket drop is being recovered via the
// Gemini session-resumption handle (see GeminiLiveSession.attemptReconnect).
// The call is still logically live; the UI shows a transient banner and the
// call clock pauses rather than resetting.
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";
