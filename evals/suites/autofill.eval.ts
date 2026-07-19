import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractApplicationFields } from "@/server/ai/extract";
import { mean, percentile } from "../lib/metrics";
import { paceGenerate } from "../lib/pace";
import { withRetry, classify } from "../lib/retry";
import { createLatencyTimer } from "../lib/timing";
import type { SuiteResult, RunOptions, ItemResult } from "../lib/types";

const here = path.dirname(fileURLToPath(import.meta.url));

type AutofillItem = {
  id: string;
  jobDescription: string;
  expected: { company: string; role: string; deadline: string | null };
};

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export const name = "autofill";

// Deterministic scoring — no LLM judge. Each extracted field is compared to a
// labelled gold value (company/role case-insensitively, deadline exactly), so
// the suite runs on generation calls alone and needs no second model.
export async function run(opts: RunOptions = {}): Promise<SuiteResult> {
  const raw = await readFile(
    path.resolve(here, "../datasets/autofill.json"),
    "utf8",
  );
  let data: AutofillItem[] = JSON.parse(raw);
  if (opts.limit) data = data.slice(0, opts.limit);

  const items: ItemResult[] = [];
  const company: number[] = [];
  const role: number[] = [];
  const deadline: number[] = [];
  const exact: number[] = [];
  let responses = 0;
  let schemaValid = 0;
  const latencies: number[] = [];
  const apiErrors: string[] = [];

  for (const it of data) {
    const timer = createLatencyTimer();
    try {
      const res = await withRetry(async () => {
        await paceGenerate();
        return timer.measure(() => extractApplicationFields(it.jobDescription));
      });
      responses++;
      schemaValid++;
      latencies.push(timer.latencyMs);

      const companyOk = norm(res.company) === norm(it.expected.company) ? 1 : 0;
      const roleOk = norm(res.role) === norm(it.expected.role) ? 1 : 0;
      const deadlineOk =
        (res.deadline ?? null) === (it.expected.deadline ?? null) ? 1 : 0;
      const allOk = companyOk && roleOk && deadlineOk ? 1 : 0;

      company.push(companyOk);
      role.push(roleOk);
      deadline.push(deadlineOk);
      exact.push(allOk);

      const misses = [
        companyOk ? "" : `company "${res.company}"≠"${it.expected.company}"`,
        roleOk ? "" : `role "${res.role}"≠"${it.expected.role}"`,
        deadlineOk
          ? ""
          : `deadline ${res.deadline}≠${it.expected.deadline}`,
      ]
        .filter(Boolean)
        .join("; ");

      items.push({
        id: it.id,
        latencyMs: timer.latencyMs,
        scores: { company: companyOk, role: roleOk, deadline: deadlineOk, exact: allOk },
        detail: misses || undefined,
      });
      continue;
    } catch (err) {
      const outcome = classify(err);

      // The API never answered: this says nothing about model quality, so the
      // item is excluded from every metric rather than scored zero.
      if (outcome.status === "api-error") {
        apiErrors.push(it.id);
        items.push({
          id: it.id,
          latencyMs: timer.latencyMs,
          scores: {},
          detail: `excluded — api error: ${outcome.error.message.slice(0, 80)}`,
        });
        continue;
      }

      // The model answered, but the answer was unusable. A real model failure —
      // scored zero on every field, not dropped.
      responses++;
      latencies.push(timer.latencyMs);
      company.push(0);
      role.push(0);
      deadline.push(0);
      exact.push(0);
      items.push({
        id: it.id,
        latencyMs: timer.latencyMs,
        scores: { company: 0, role: 0, deadline: 0, exact: 0 },
        detail: `invalid output (${outcome.error.kind}): ${outcome.error.message.slice(0, 80)}`,
      });
    }
  }

  const notes = apiErrors.length
    ? [
        `${apiErrors.length}/${data.length} items excluded after retries — the API never returned a response (${apiErrors.join(", ")}). Metrics are over the ${responses} responses actually received.`,
      ]
    : undefined;

  return {
    name,
    description:
      "New-application autofill: company/role/deadline extraction accuracy (exact-match, no judge)",
    n: responses,
    metrics: {
      "company accuracy": mean(company),
      "role accuracy": mean(role),
      "deadline accuracy": mean(deadline),
      "all-fields exact": mean(exact),
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
