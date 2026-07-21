import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  jdAnalysisSchema,
  storedJdAnalysisSchema,
  MAX_SKILLS,
  MAX_SKILL_LENGTH,
  MAX_SUMMARY_LENGTH,
} from "@/lib/schemas/jd-analysis";

const valid = {
  summary: "Backend role building APIs.",
  seniority: "mid",
  requiredSkills: ["TypeScript", "PostgreSQL"],
  niceToHave: ["GraphQL"],
};

describe("jdAnalysisSchema (AI output validation)", () => {
  it("accepts a well-formed analysis unchanged", () => {
    expect(jdAnalysisSchema.parse(valid)).toEqual(valid);
  });

  it("rejects a seniority outside the enum", () => {
    for (const seniority of ["wizard", "principal"]) {
      expect(jdAnalysisSchema.safeParse({ ...valid, seniority }).success).toBe(
        false,
      );
    }
  });

  it("rejects non-string skills", () => {
    expect(
      jdAnalysisSchema.safeParse({ ...valid, requiredSkills: [42] }).success,
    ).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(
      jdAnalysisSchema.safeParse({ summary: "x", requiredSkills: ["a"] })
        .success,
    ).toBe(false);
  });

  it("derives a JSON schema usable as Gemini's responseJsonSchema", () => {
    const schema = z.toJSONSchema(jdAnalysisSchema) as {
      type?: string;
      properties?: Record<string, { type?: string; enum?: string[] }>;
    };
    expect(schema.type).toBe("object");
    expect(schema.properties?.requiredSkills?.type).toBe("array");
    expect(schema.properties?.seniority?.enum).toContain("senior");
  });

  it("caps how many skills an analysis can carry", () => {
    const tooMany = Array.from({ length: MAX_SKILLS + 1 }, (_, i) => `skill${i}`);
    expect(
      jdAnalysisSchema.safeParse({ ...valid, requiredSkills: tooMany }).success,
    ).toBe(false);
    expect(
      jdAnalysisSchema.safeParse({ ...valid, niceToHave: tooMany }).success,
    ).toBe(false);
  });

  it("caps the length of a single skill and of the summary", () => {
    expect(
      jdAnalysisSchema.safeParse({
        ...valid,
        requiredSkills: ["x".repeat(MAX_SKILL_LENGTH + 1)],
      }).success,
    ).toBe(false);
    expect(
      jdAnalysisSchema.safeParse({
        ...valid,
        summary: "x".repeat(MAX_SUMMARY_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it("passes the caps through to Gemini's JSON schema", () => {
    const schema = z.toJSONSchema(jdAnalysisSchema) as {
      properties?: Record<
        string,
        { maxItems?: number; maxLength?: number; items?: { maxLength?: number } }
      >;
    };
    expect(schema.properties?.requiredSkills?.maxItems).toBe(MAX_SKILLS);
    expect(schema.properties?.requiredSkills?.items?.maxLength).toBe(
      MAX_SKILL_LENGTH,
    );
    expect(schema.properties?.summary?.maxLength).toBe(MAX_SUMMARY_LENGTH);
  });
});

describe("storedJdAnalysisSchema", () => {
  it("allows optional skillMatches", () => {
    const stored = { ...valid, skillMatches: ["TypeScript"] };
    expect(storedJdAnalysisSchema.parse(stored)).toEqual(stored);
  });

  it("stays valid without skillMatches", () => {
    expect(storedJdAnalysisSchema.parse(valid)).toEqual(valid);
  });

  it("caps skillMatches the same way as the skill lists", () => {
    const tooMany = Array.from({ length: MAX_SKILLS + 1 }, (_, i) => `skill${i}`);
    expect(
      storedJdAnalysisSchema.safeParse({ ...valid, skillMatches: tooMany })
        .success,
    ).toBe(false);
  });
});
