import { GoogleGenAI } from "@google/genai";
import { traceable } from "langsmith/traceable";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1" } });
  }
  return client;
}

/** Simple delay for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate an embedding vector using Gemini's text-embedding model.
 * Returns a 768-dimensional vector. Traced via LangSmith.
 * Retries once on rate limit (429) with backoff.
 */
export const generateEmbedding = traceable(
  async function generateEmbedding(text: string, retries = 1): Promise<number[]> {
    const ai = getClient();
    try {
      const result = await ai.models.embedContent({
        model: "gemini-embedding-exp-03-07",
        contents: [text],
      });

      const embedding = result.embeddings?.[0];
      if (!embedding?.values) {
        throw new Error("No embedding returned from Gemini");
      }
      return embedding.values;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429 && retries > 0) {
        console.warn("[Embeddings] Rate limited, retrying in 2s...");
        await delay(2000);
        return generateEmbedding(text, retries - 1);
      }
      throw err;
    }
  },
  { name: "generateEmbedding", run_type: "embedding" },
);

/**
 * Generate embeddings for multiple texts in batch. Traced.
 */
export const generateEmbeddings = traceable(
  async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Sequential with small delay to avoid rate limits
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await generateEmbedding(text));
      if (texts.length > 3) await delay(200); // throttle for large batches
    }
    return results;
  },
  { name: "generateEmbeddings", run_type: "embedding" },
);
