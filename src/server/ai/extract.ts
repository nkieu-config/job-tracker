import "server-only";

import { z } from "zod";
import {
  jdExtractionSchema,
  type JdExtraction,
} from "@/lib/schemas/jd-extract";
import { AiError } from "@/lib/errors";
import { recordAiUsage } from "@/server/observability";
import {
  getGeminiClient,
  GENERATION_MODEL,
  THINKING_DISABLED,
  billedOutputTokens,
} from "./gemini";
import { fenceUntrusted, UNTRUSTED_DATA_RULE } from "./prompt";

const TIMEOUT_MS = 30_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const responseJsonSchema = (() => {
  const schema = z.toJSONSchema(jdExtractionSchema) as Record<string, unknown>;
  delete schema["$schema"];
  return schema;
})();

// A yyyy-mm-dd that the calendar actually has — the regex alone would accept
// 2026-13-40. An unparseable or impossible date becomes null rather than a
// value the date input would silently reject.
function normalizeDeadline(value: string | null): string | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

export async function extractApplicationFields(
  jobDescription: string,
  userId?: string,
): Promise<JdExtraction> {
  const ai = getGeminiClient();

  const prompt = `You are a data-entry assistant. From the job description below, extract fields to pre-fill an application form.

Guidelines:
- company: the hiring company's name. Empty string if not stated.
- role: the job title (e.g. "Senior Backend Engineer"). Empty string if not stated.
- deadline: the application deadline as an ISO date (YYYY-MM-DD), or null if the description doesn't state one. Do not guess a deadline from a posting date.
Use only information present in the job description. Do not invent a company, role, or date.
${UNTRUSTED_DATA_RULE}

Job description:
${fenceUntrusted(jobDescription)}`;

  const t0 = performance.now();
  let text: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema,
        temperature: 0.1,
        thinkingConfig: THINKING_DISABLED,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    text = response.text;
    recordAiUsage({
      feature: "autofill",
      model: GENERATION_MODEL,
      userId,
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: billedOutputTokens(response.usageMetadata),
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
      latencyMs: performance.now() - t0,
    });
  } catch (err) {
    recordAiUsage({
      feature: "autofill",
      model: GENERATION_MODEL,
      userId,
      latencyMs: performance.now() - t0,
      ok: false,
    });
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new AiError(
        "The AI took too long to respond. Please try again.",
        "timeout",
        { cause: err },
      );
    }
    console.error("[ai:extract] request failed", err);
    throw new AiError("The AI service failed. Please try again.", "transport", {
      cause: err,
    });
  }

  if (!text) {
    throw new AiError("The AI returned an empty response.", "empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new AiError("The AI returned malformed JSON.", "malformed", {
      cause: err,
    });
  }

  const result = jdExtractionSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiError(
      "The AI response didn't match the expected format.",
      "schema",
      { cause: result.error },
    );
  }
  return {
    ...result.data,
    deadline: normalizeDeadline(result.data.deadline),
  };
}
