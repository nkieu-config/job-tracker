import { z } from "zod";

export const SENIORITY_LEVELS = [
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "unknown",
] as const;

export const MAX_SUMMARY_LENGTH = 1200;
export const MAX_SKILL_LENGTH = 80;
export const MAX_SKILLS = 40;

// The structure we force Gemini to return (and re-validate on the way back).
const skillSchema = z.string().max(MAX_SKILL_LENGTH);

export const jdAnalysisSchema = z.object({
  summary: z.string().max(MAX_SUMMARY_LENGTH),
  seniority: z.enum(SENIORITY_LEVELS),
  requiredSkills: z.array(skillSchema).max(MAX_SKILLS),
  niceToHave: z.array(skillSchema).max(MAX_SKILLS),
});

export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;

export const storedJdAnalysisSchema = jdAnalysisSchema.extend({
  skillMatches: z.array(skillSchema).max(MAX_SKILLS).optional(),
});

export type StoredJdAnalysis = z.infer<typeof storedJdAnalysisSchema>;
