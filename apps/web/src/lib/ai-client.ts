import type { JdAnalysis } from "@job-tracker/shared/schemas/jd-analysis";
import { AiError } from "@job-tracker/shared/errors";

export { AiError };

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:4000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

function serviceHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-internal-key": INTERNAL_API_KEY ?? "",
  };
}

async function readServiceError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return (await res.text()) || fallback;
  }
}

export async function analyzeJobDescription(
  jobDescription: string,
): Promise<JdAnalysis> {
  const res = await fetch(`${AI_SERVICE_URL}/analyze`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ jobDescription }),
  });

  if (!res.ok) {
    throw new AiError(await readServiceError(res, "Analysis failed."));
  }

  return res.json() as Promise<JdAnalysis>;
}

export type EmbeddingTask =
  | "RETRIEVAL_QUERY"
  | "RETRIEVAL_DOCUMENT"
  | "SEMANTIC_SIMILARITY";

export async function embedText(
  text: string,
  taskType: EmbeddingTask = "SEMANTIC_SIMILARITY",
): Promise<number[]> {
  const res = await fetch(`${AI_SERVICE_URL}/embed`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ text, taskType }),
  });

  if (!res.ok) {
    throw new AiError(await readServiceError(res, "Embedding failed."));
  }

  const body = (await res.json()) as { vector: number[] };
  return body.vector;
}

export async function tailorBulletsStream(
  jobDescription: string,
  experience: string,
): Promise<Response> {
  return fetch(`${AI_SERVICE_URL}/tailor`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ jobDescription, experience }),
  });
}
