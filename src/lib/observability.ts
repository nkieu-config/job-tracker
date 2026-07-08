export type AiFeature = "analyze" | "embed" | "tailor" | "interview";

// Approximate Gemini pricing, USD per 1M tokens. Update from current rates —
// this drives the cost estimate on the AI-usage dashboard only.
export const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-embedding-001": { input: 0.15, output: 0 },
};

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] ?? { input: 0, output: 0 };
  return (promptTokens * p.input + outputTokens * p.output) / 1_000_000;
}

type UsageEntry = {
  feature: AiFeature;
  model: string;
  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  ok?: boolean;
};

// Fire-and-forget: usage logging must never slow down or break a feature, so we
// don't await it and swallow any error.
export function recordAiUsage(entry: UsageEntry): void {
  // The eval harness imports lib/ai directly; it disables logging so eval runs
  // don't pollute production usage data.
  if (process.env.AI_USAGE_DISABLED === "1") return;
  const promptTokens = entry.promptTokens ?? 0;
  const outputTokens = entry.outputTokens ?? 0;
  // Import Prisma lazily so importing lib/ai (e.g. from the eval harness) never
  // pulls in the DB client until a real call is actually logged.
  void import("@/lib/prisma")
    .then(({ prisma }) =>
      prisma.aiUsage.create({
        data: {
          feature: entry.feature,
          model: entry.model,
          promptTokens,
          outputTokens,
          totalTokens: entry.totalTokens ?? promptTokens + outputTokens,
          latencyMs: Math.round(entry.latencyMs),
          ok: entry.ok ?? true,
        },
      }),
    )
    .catch(() => {});
}
