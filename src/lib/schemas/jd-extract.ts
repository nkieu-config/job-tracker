import { z } from "zod";

// What we pull out of a pasted job description to pre-fill the new-application
// form. Empty strings (not absent keys) when the JD doesn't name a company or
// role; `deadline` is an ISO yyyy-mm-dd date or null when none is stated.
export const jdExtractionSchema = z.object({
  company: z.string(),
  role: z.string(),
  deadline: z.string().nullable(),
});

export type JdExtraction = z.infer<typeof jdExtractionSchema>;
