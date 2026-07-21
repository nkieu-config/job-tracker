import { z } from "zod";
import { getGeminiClient, GENERATION_MODEL } from "@/server/ai/gemini";

// A model judging its own output scores it leniently (self-preference bias), so
// the judge is a different model from the one under test — a newer-generation
// flash, stronger than the 2.5-flash it scores. (The earlier gemini-2.5-pro
// default is no longer served on the Gemini free tier.) Override with
// EVAL_JUDGE_MODEL; setting it equal to GENERATION_MODEL is a valid but
// self-judging configuration, and the harness says so.
export const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? "gemini-3.5-flash";

export const judgeIsSelfJudging = (): boolean => JUDGE_MODEL === GENERATION_MODEL;

// LLM-as-judge: a separate model call scores generated bullets against a
// rubric. Temperature 0 for repeatability; output is Zod-validated like any
// other model response.
const rubricSchema = z.object({
  relevance: z.number().min(1).max(5),
  grounded: z.number().min(1).max(5),
  formatting: z.number().min(1).max(5),
  fabricated: z.boolean(),
  fabricatedItems: z.array(z.string()),
});

export type Rubric = z.infer<typeof rubricSchema>;

const responseJsonSchema = (() => {
  const schema = z.toJSONSchema(rubricSchema) as Record<string, unknown>;
  delete schema["$schema"];
  return schema;
})();

const coachRubricSchema = z.object({
  relevance: z.number().min(1).max(5),
  grounded: z.number().min(1).max(5),
  actionable: z.number().min(1).max(5),
  fabricated: z.boolean(),
  fabricatedItems: z.array(z.string()),
});

export type CoachRubric = z.infer<typeof coachRubricSchema>;

const coachResponseJsonSchema = (() => {
  const schema = z.toJSONSchema(coachRubricSchema) as Record<string, unknown>;
  delete schema["$schema"];
  return schema;
})();

// LLM-as-judge for the pipeline coach. The model sees the exact snapshot the
// advice was written from (as JSON) so it can flag any number or skill in the
// advice that isn't in the data.
export async function judgeCoach(
  snapshotJson: string,
  advice: string,
): Promise<{ rubric: CoachRubric; tokens: number }> {
  const ai = getGeminiClient();

  const prompt = `You are a strict evaluator of AI-generated job-search coaching. The coach was given ONLY the pipeline data below (as JSON) and produced the ADVICE. Score the ADVICE on a 1-5 integer scale.

- relevance: does the advice speak to THIS pipeline's situation, not generic tips? (5 = specific to the data, 1 = boilerplate).
- grounded: are all figures and skills it cites actually present in the data? (5 = every claim traceable to the data, 1 = mostly invented).
- actionable: are the recommendations concrete next steps the candidate can act on? (5 = clearly actionable, 1 = vague).
- fabricated: true if the advice states ANY number, skill, company, or fact not present in the pipeline data.
- fabricatedItems: list each invented specific (empty if none).

Judge only what is written.

PIPELINE DATA (JSON):
"""
${snapshotJson}
"""

ADVICE:
"""
${advice}
"""`;

  const res = await ai.models.generateContent({
    model: JUDGE_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: coachResponseJsonSchema,
      temperature: 0,
    },
  });

  const rubric = coachRubricSchema.parse(JSON.parse(res.text ?? "{}"));
  const tokens = res.usageMetadata?.totalTokenCount ?? 0;
  return { rubric, tokens };
}

const interviewRubricSchema = z.object({
  relevance: z.number().min(1).max(5),
  grounded: z.number().min(1).max(5),
  actionable: z.number().min(1).max(5),
  fabricated: z.boolean(),
  fabricatedItems: z.array(z.string()),
});

export type InterviewRubric = z.infer<typeof interviewRubricSchema>;

const interviewResponseJsonSchema = (() => {
  const schema = z.toJSONSchema(interviewRubricSchema) as Record<string, unknown>;
  delete schema["$schema"];
  return schema;
})();

// LLM-as-judge for the interview prep sheet. The judge sees only the job
// description the sheet was generated from, so it can flag any requirement,
// technology, or responsibility the questions assume but the JD never states.
export async function judgeInterview(
  jobDescription: string,
  sheet: string,
): Promise<{ rubric: InterviewRubric; tokens: number }> {
  const ai = getGeminiClient();

  const prompt = `You are a strict evaluator of an AI-generated interview prep sheet. The generator was given ONLY the job description below and produced the SHEET (technical questions, behavioral questions, and questions to ask the interviewer, each with an "answer key"). Score the SHEET on a 1-5 integer scale.

- relevance: do the questions target the specific skills, technologies, and seniority in THIS job description, rather than generic interview questions? (5 = tightly matched, 1 = boilerplate).
- grounded: do the questions and answer keys stay consistent with what the job description says about the ROLE — its seniority, required experience, and responsibilities — without assuming role facts it never states? (5 = fully consistent, 1 = mostly invented).
- actionable: would the answer keys and suggested questions genuinely help a candidate prepare? (5 = concrete and useful, 1 = vague).
- fabricated: true ONLY if the sheet asserts a fact about the ROLE or the CANDIDATE that the job description does not support — for example a seniority level, years of experience, team structure, or a requirement the JD never states. Naming a concrete technology or sub-topic to ASK ABOUT, when it falls within a skill area the JD already lists (e.g. asking about Kubernetes NetworkPolicies for a role that lists Kubernetes), is the generator's job and is NOT fabrication.
- fabricatedItems: list each unsupported assumption about the role or candidate (empty if none).

Judge only what is written.

JOB DESCRIPTION:
"""
${jobDescription}
"""

SHEET:
"""
${sheet}
"""`;

  const res = await ai.models.generateContent({
    model: JUDGE_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: interviewResponseJsonSchema,
      temperature: 0,
    },
  });

  const rubric = interviewRubricSchema.parse(JSON.parse(res.text ?? "{}"));
  const tokens = res.usageMetadata?.totalTokenCount ?? 0;
  return { rubric, tokens };
}

export async function judgeBullets(
  jobDescription: string,
  experience: string,
  output: string,
): Promise<{ rubric: Rubric; tokens: number }> {
  const ai = getGeminiClient();

  const prompt = `You are a strict evaluator of AI-generated resume bullet points. Score the OUTPUT on a 1-5 integer scale for each criterion.

- relevance: how well the bullets target the job description (5 = tightly tailored, 1 = generic).
- grounded: are all claims supported by the candidate's experience? (5 = fully supported, 1 = mostly invented).
- formatting: proper bullet list, strong action verbs, concise, no preamble (5 = perfect).
- fabricated: true if ANY bullet introduces a specific technology, metric, company, or fact that is NOT present in the candidate's experience or the job description.
- fabricatedItems: list each invented specific (empty if none).

Judge only what is written. Do not reward or penalise length.

JOB DESCRIPTION:
"""
${jobDescription}
"""

CANDIDATE EXPERIENCE:
"""
${experience}
"""

GENERATED BULLETS:
"""
${output}
"""`;

  const res = await ai.models.generateContent({
    model: JUDGE_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema,
      temperature: 0,
    },
  });

  const rubric = rubricSchema.parse(JSON.parse(res.text ?? "{}"));
  const tokens = res.usageMetadata?.totalTokenCount ?? 0;
  return { rubric, tokens };
}
