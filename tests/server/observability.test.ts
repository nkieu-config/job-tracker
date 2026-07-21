import { describe, it, expect } from "vitest";
import { PRICING, estimateCostUsd } from "@/server/observability";
import {
  EMBEDDING_MODEL,
  GENERATION_MODEL,
  TAILORING_MODEL,
} from "@/server/ai/models";

// The dashboard's cost column is only as honest as this table. A model swap in
// models.ts used to leave PRICING behind, and an unpriced model reports $0 —
// cost appearing to *drop* after an upgrade.
describe("PRICING tracks the models the app actually calls", () => {
  it.each([GENERATION_MODEL, TAILORING_MODEL, EMBEDDING_MODEL])(
    "prices %s",
    (model) => {
      expect(Object.keys(PRICING)).toContain(model);
    },
  );

  it("reports a non-zero cost for the generation model", () => {
    expect(
      estimateCostUsd(GENERATION_MODEL, 1_000_000, 1_000_000),
    ).toBeGreaterThan(0);
  });

  it("keeps pricing a retired model so historical rows keep their cost", () => {
    expect(estimateCostUsd("gemini-2.5-flash", 1_000_000, 0)).toBeGreaterThan(0);
  });

  it("reports zero for a model nobody priced", () => {
    expect(estimateCostUsd("gemini-not-a-real-model", 1_000_000, 0)).toBe(0);
  });
});
