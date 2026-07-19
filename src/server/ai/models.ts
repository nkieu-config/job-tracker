export const GENERATION_MODEL = "gemini-3.1-flash-lite";
export const EMBEDDING_MODEL = "gemini-embedding-001";

// Bullet tailoring is held to a higher grounding bar than the extraction tasks.
// The eval harness measured gemini-3.1-flash-lite fabricating a specific in half
// its tailoring outputs (50% hallucination, grounding 3.83/5 — below the gate),
// while a full flash keeps it near zero. So tailoring alone runs on the stronger
// model; every other feature stays on the higher-quota lite model.
export const TAILORING_MODEL = "gemini-3.5-flash";

// Gemini flash models can spend "thinking" tokens, billed at the output rate.
// These are extraction and rewriting tasks with a fixed output shape, so
// thinking buys latency and cost, not quality — disable it.
export const THINKING_DISABLED = { thinkingBudget: 0 } as const;

// Thinking tokens are billed as output. Count them so the usage dashboard
// doesn't understate cost, and so promptTokens + outputTokens reconciles with
// the totalTokenCount the API reports.
export function billedOutputTokens(usage?: {
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
}): number {
  return (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
}
