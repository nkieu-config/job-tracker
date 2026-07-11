import { AiError } from "@/lib/errors";
import { sleep } from "./pace";

const DEFAULT_MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2_000;

// EVAL_MAX_ATTEMPTS counts total attempts, not extra retries: 1 means "call the
// API once, never retry". Anything below 1 would silently skip the call
// entirely, so it is rejected rather than clamped.
export function maxAttemptsFromEnv(
  raw: string | undefined = process.env.EVAL_MAX_ATTEMPTS,
): number {
  if (raw === undefined || raw.trim() === "") return DEFAULT_MAX_ATTEMPTS;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      `EVAL_MAX_ATTEMPTS must be an integer >= 1 (total attempts), got ${JSON.stringify(raw)}`,
    );
  }
  return parsed;
}

function isRetryable(err: unknown): boolean {
  return err instanceof AiError && err.retryable;
}

// A transport blip must not be scored as a model failure, so transient errors
// are retried with backoff before the item is counted as an API error.
export async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, err: unknown) => void,
  maxAttempts: number = maxAttemptsFromEnv(),
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err) || attempt === maxAttempts) throw err;
      onRetry?.(attempt, err);
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  throw new Error(`withRetry exhausted ${maxAttempts} attempts without result`);
}

export type Failure =
  | { status: "api-error"; error: Error }
  | { status: "invalid-output"; error: AiError };

// Separates "the API never answered" from "the model answered with garbage" —
// only the latter is evidence about model quality.
export function classify(err: unknown): Failure {
  if (err instanceof AiError && err.isModelOutputFailure) {
    return { status: "invalid-output", error: err };
  }
  return {
    status: "api-error",
    error: err instanceof Error ? err : new Error(String(err)),
  };
}
