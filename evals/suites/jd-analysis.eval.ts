import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeJobDescription } from "@/server/ai/analyze";
import { skillPRF1, macroAverage, accuracy, mean, percentile } from "../lib/metrics";
import { paceGenerate } from "../lib/pace";
import { withRetry, classify } from "../lib/retry";
import { createLatencyTimer } from "../lib/timing";
import type { SuiteResult, RunOptions, ItemResult } from "../lib/types";

const here = path.dirname(fileURLToPath(import.meta.url));

type JdItem = {
  id: string;
  jobDescription: string;
  expected: { seniority: string; requiredSkills: string[]; niceToHave?: string[] };
};

export const name = "jd-analysis";

export async function run(opts: RunOptions = {}): Promise<SuiteResult> {
  const raw = await readFile(
    path.resolve(here, "../datasets/jd-analysis.json"),
    "utf8",
  );
  let data: JdItem[] = JSON.parse(raw);
  if (opts.limit) data = data.slice(0, opts.limit);

  const items: ItemResult[] = [];
  const prf1s = [];
  const predSeniority: string[] = [];
  const goldSeniority: string[] = [];
  let schemaValid = 0;
  let responses = 0;
  const apiErrors: string[] = [];
  const responseLatencies: number[] = [];

  for (const it of data) {
    const timer = createLatencyTimer();
    try {
      const res = await withRetry(async () => {
        await paceGenerate();
        return timer.measure(() => analyzeJobDescription(it.jobDescription));
      });
      const latencyMs = timer.latencyMs;
      responses++;
      schemaValid++;
      responseLatencies.push(latencyMs);
      const prf1 = skillPRF1(res.requiredSkills, it.expected.requiredSkills);
      prf1s.push(prf1);
      predSeniority.push(res.seniority);
      goldSeniority.push(it.expected.seniority);
      const seniorityOk = res.seniority === it.expected.seniority;
      const detail = [
        prf1.falseNegatives.length ? `missed: ${prf1.falseNegatives.join(", ")}` : "",
        prf1.falsePositives.length ? `extra: ${prf1.falsePositives.join(", ")}` : "",
        seniorityOk ? "" : `seniority ${res.seniority}≠${it.expected.seniority}`,
      ]
        .filter(Boolean)
        .join("; ");
      items.push({
        id: it.id,
        latencyMs,
        scores: {
          f1: prf1.f1,
          precision: prf1.precision,
          recall: prf1.recall,
          seniority: seniorityOk ? 1 : 0,
        },
        detail: detail || undefined,
      });
      continue;
    } catch (err) {
      const latencyMs = timer.latencyMs;
      const outcome = classify(err);

      // The API never answered: this says nothing about model quality, so the
      // item is excluded from every metric rather than scored zero.
      if (outcome.status === "api-error") {
        apiErrors.push(it.id);
        items.push({
          id: it.id,
          latencyMs,
          scores: {},
          detail: `excluded — api error: ${outcome.error.message}`,
        });
        continue;
      }

      // The model answered, but the answer was unusable. That is a real model
      // failure and counts against both schema validity and P/R/F1.
      responses++;
      responseLatencies.push(latencyMs);
      predSeniority.push("<invalid>");
      goldSeniority.push(it.expected.seniority);
      prf1s.push(skillPRF1([], it.expected.requiredSkills));
      items.push({
        id: it.id,
        latencyMs,
        scores: { f1: 0, precision: 0, recall: 0, seniority: 0 },
        detail: `invalid output (${outcome.error.kind}): ${outcome.error.message}`,
      });
    }
  }

  const macro = macroAverage(prf1s);
  const latencies = responseLatencies;

  const notes = apiErrors.length
    ? [
        `${apiErrors.length}/${data.length} items excluded after retries — the API never returned a response (${apiErrors.join(", ")}). Metrics are over the ${responses} responses actually received.`,
      ]
    : undefined;

  return {
    name,
    description:
      "JD skill extraction (macro P/R/F1) + seniority accuracy + schema validity",
    n: responses,
    metrics: {
      f1: macro.f1,
      precision: macro.precision,
      recall: macro.recall,
      "seniority accuracy": accuracy(predSeniority, goldSeniority),
      "schema valid": responses ? schemaValid / responses : 0,
    },
    timingMs: {
      mean: mean(latencies),
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
    },
    items,
    notes,
  };
}
