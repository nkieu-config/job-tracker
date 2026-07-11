import { describe, it, expect } from "vitest";
import { checkSuite } from "@/../evals/lib/thresholds";
import type { SuiteResult } from "@/../evals/lib/types";

function suite(
  name: string,
  metrics: Record<string, number>,
  n = 10,
): SuiteResult {
  return {
    name,
    description: "",
    n,
    metrics,
    timingMs: { mean: 0, p50: 0, p95: 0 },
    items: [],
  };
}

describe("checkSuite", () => {
  it("passes a suite that clears every threshold", () => {
    const violations = checkSuite(
      suite("jd-analysis", {
        f1: 0.9,
        recall: 0.9,
        "seniority accuracy": 0.8,
        "schema valid": 1,
      }),
    );
    expect(violations).toEqual([]);
  });

  it("flags a metric that falls below its minimum", () => {
    const violations = checkSuite(
      suite("jd-analysis", {
        f1: 0.5,
        recall: 0.9,
        "seniority accuracy": 0.8,
        "schema valid": 1,
      }),
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("f1");
  });

  it("flags a metric that exceeds its maximum (hallucination rate)", () => {
    const violations = checkSuite(
      suite("tailoring", {
        "relevance /5": 4,
        "grounded /5": 4,
        "formatting /5": 4,
        "hallucination rate": 0.5,
      }),
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("hallucination rate");
  });

  it("treats a missing metric as a violation rather than a pass", () => {
    const violations = checkSuite(suite("jd-analysis", { f1: 0.9 }));
    expect(violations.some((v) => v.includes("recall"))).toBe(true);
  });

  it("fails a suite that scored no items even if metrics look fine", () => {
    const violations = checkSuite(
      suite("jd-analysis", { f1: 0, recall: 0 }, 0),
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("no items");
  });

  it("ignores suites that have no configured thresholds", () => {
    expect(checkSuite(suite("unknown-suite", { whatever: 0 }))).toEqual([]);
  });
});
