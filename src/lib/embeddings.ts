import { GoogleGenAI } from "@google/genai";
import { traceable } from "langsmith/traceable";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Generate an embedding vector using Gemini's text-embedding model.
 * Returns a 768-dimensional vector. Traced via LangSmith.
 */
export const generateEmbedding = traceable(
  async function generateEmbedding(text: string): Promise<number[]> {
    const ai = getClient();
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [text],
    });

    const embedding = result.embeddings?.[0];
    if (!embedding?.values) {
      throw new Error("No embedding returned from Gemini");
    }

    return embedding.values;
  },
  { name: "generateEmbedding", run_type: "embedding" },
);

/**
 * Generate embeddings for multiple texts in batch. Traced.
 */
export const generateEmbeddings = traceable(
  async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results = await Promise.all(texts.map((t) => generateEmbedding(t)));
    return results;
  },
  { name: "generateEmbeddings", run_type: "embedding" },
);
