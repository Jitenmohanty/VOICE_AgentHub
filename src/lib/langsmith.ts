import { Client } from "langsmith";

let _client: Client | null = null;

export function getLangSmithClient(): Client {
  if (!_client) {
    _client = new Client();
  }
  return _client;
}

/** Flush pending traces — call at end of API routes in serverless */
export async function flushTraces(): Promise<void> {
  if (process.env.LANGSMITH_TRACING === "true") {
    try {
      await getLangSmithClient().awaitPendingTraceBatches();
    } catch {
      // Silent — tracing failure shouldn't break the app
    }
  }
}

/** Check if tracing is enabled */
export function isTracingEnabled(): boolean {
  return process.env.LANGSMITH_TRACING === "true";
}
