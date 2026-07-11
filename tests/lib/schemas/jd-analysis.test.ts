import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  jdAnalysisSchema,
  storedJdAnalysisSchema,
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
});

describe("storedJdAnalysisSchema", () => {
  it("allows optional skillMatches", () => {
    const stored = { ...valid, skillMatches: ["TypeScript"] };
    expect(storedJdAnalysisSchema.parse(stored)).toEqual(stored);
  });

  it("stays valid without skillMatches", () => {
    expect(storedJdAnalysisSchema.parse(valid)).toEqual(valid);
  });
});
