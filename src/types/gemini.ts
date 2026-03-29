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

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
