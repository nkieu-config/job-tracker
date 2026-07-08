import { AiError } from "@/lib/errors";
import { recordAiUsage } from "@/lib/observability";
import { getGeminiClient, EMBEDDING_MODEL } from "./gemini";

export const EMBEDDING_DIM = 768;
const MAX_INPUT_CHARS = 8000;

export type EmbeddingTask =
  | "RETRIEVAL_QUERY"
  | "RETRIEVAL_DOCUMENT"
  | "SEMANTIC_SIMILARITY";

export async function embedText(
  text: string,
  taskType: EmbeddingTask = "SEMANTIC_SIMILARITY",
): Promise<number[]> {
  const [vector] = await embedTextBatch([text], taskType);
  return vector;
}

export async function embedTextBatch(
  texts: string[],
  taskType: EmbeddingTask = "SEMANTIC_SIMILARITY",
): Promise<number[][]> {
  const ai = getGeminiClient();
  const inputs = texts.map((text) => text.slice(0, MAX_INPUT_CHARS));

  const t0 = performance.now();
  let res;
  try {
    res = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: inputs,
      config: { taskType, outputDimensionality: EMBEDDING_DIM },
    });
  } catch {
    recordAiUsage({
      feature: "embed",
      model: EMBEDDING_MODEL,
      latencyMs: performance.now() - t0,
      ok: false,
    });
    throw new AiError("Failed to generate embeddings. Please try again.");
  }

  // The embeddings API doesn't return a token count; estimate from input size
  // (~4 chars/token) so the cost figure isn't silently zero.
  const estTokens = Math.ceil(inputs.reduce((n, s) => n + s.length, 0) / 4);
  recordAiUsage({
    feature: "embed",
    model: EMBEDDING_MODEL,
    promptTokens: estTokens,
    totalTokens: estTokens,
    latencyMs: performance.now() - t0,
  });

  const embeddings = res.embeddings;
  if (!embeddings || embeddings.length !== inputs.length) {
    throw new AiError("The embedding batch had an unexpected size.");
  }
  return embeddings.map((embedding) => {
    const values = embedding.values;
    if (!values || values.length !== EMBEDDING_DIM) {
      throw new AiError("The embedding had an unexpected size.");
    }
    return values;
  });
}
