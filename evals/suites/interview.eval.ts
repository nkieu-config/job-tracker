import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { interviewPrepStream } from "@/server/ai/stream";
import { judgeInterview, JUDGE_MODEL, judgeIsSelfJudging } from "../lib/judge";
import { paceGenerate } from "../lib/pace";
import { withRetry, classify } from "../lib/retry";
import { createLatencyTimer } from "../lib/timing";
import { mean, percentile } from "../lib/metrics";
import type { SuiteResult, RunOptions, ItemResult } from "../lib/types";

const here = path.dirname(fileURLToPath(import.meta.url));

type InterviewItem = { id: string; role: string; jobDescription: string };

const HEADINGS = {
  technical: "technical questions",
  behavioral: "behavioral questions",
  interviewer: "questions to ask the interviewer",
};

type ParsedSheet = {
  hasTechnical: boolean;
  hasBehavioral: boolean;
  hasInterviewer: boolean;
  technicalCount: number;
  behavioralCount: number;
  interviewerCount: number;
  answerKeys: number;
  hasMarkdownNoise: boolean;
};

// The prompt fixes the sheet's shape (three headings, "- " question bullets, an
// indented "Strong answers cover:" line under each). Parsing it back is a
// model-free check that the generator obeyed that contract — no judge needed.
function parseSheet(text: string): ParsedSheet {
  const lines = text.split("\n");
  const idx = { technical: -1, behavioral: -1, interviewer: -1 };
  lines.forEach((line, i) => {
    const norm = line.trim().toLowerCase();
    if (idx.technical === -1 && norm === HEADINGS.technical) idx.technical = i;
    else if (idx.behavioral === -1 && norm === HEADINGS.behavioral) idx.behavioral = i;
    else if (idx.interviewer === -1 && norm === HEADINGS.interviewer) idx.interviewer = i;
  });

  const bulletsBetween = (start: number, end: number): number => {
    if (start === -1) return 0;
    const stop = end === -1 ? lines.length : end;
    let count = 0;
    for (let i = start + 1; i < stop; i++) {
      if (/^\s*-\s+/.test(lines[i])) count++;
    }
    return count;
  };

  return {
    hasTechnical: idx.technical !== -1,
    hasBehavioral: idx.behavioral !== -1,
    hasInterviewer: idx.interviewer !== -1,
    technicalCount: bulletsBetween(idx.technical, idx.behavioral),
    behavioralCount: bulletsBetween(idx.behavioral, idx.interviewer),
    interviewerCount: bulletsBetween(idx.interviewer, -1),
    answerKeys: lines.filter((l) => /strong answers cover:/i.test(l)).length,
    hasMarkdownNoise: lines.some(
      (l) => l.includes("**") || /^\s*#{1,6}\s/.test(l),
    ),
  };
}

// Every section present, the technical count within the requested 5-7 (with a
// little slack for over-delivery), and both other sections at their required
// three.
function structureIsValid(p: ParsedSheet): boolean {
  return (
    p.hasTechnical &&
    p.hasBehavioral &&
    p.hasInterviewer &&
    p.technicalCount >= 5 &&
    p.technicalCount <= 8 &&
    p.behavioralCount >= 3 &&
    p.interviewerCount >= 3
  );
}

function answerKeyCoverage(p: ParsedSheet): number {
  const expected = p.technicalCount + p.behavioralCount;
  if (expected === 0) return 0;
  return Math.min(1, p.answerKeys / expected);
}

async function collect(stream: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const chunk of stream) out += chunk;
  return out;
}

export const name = "interview";

// LLM-as-judge over generated interview prep (relevance/grounded/actionable,
// 1-5) plus a deterministic structure-validity rate, answer-key coverage, and
// hallucination rate.
export async function run(opts: RunOptions = {}): Promise<SuiteResult> {
  const raw = await readFile(
    path.resolve(here, "../datasets/interview.json"),
    "utf8",
  );
  let data: InterviewItem[] = JSON.parse(raw);
  if (opts.limit) data = data.slice(0, opts.limit);

  const items: ItemResult[] = [];
  const relevance: number[] = [];
  const grounded: number[] = [];
  const actionable: number[] = [];
  const structureValid: number[] = [];
  const coverage: number[] = [];
  const judgeTokens: number[] = [];
  let fabricatedCount = 0;

  let judged = 0;
  const latencies: number[] = [];
  const apiErrors: string[] = [];

  for (const it of data) {
    const timer = createLatencyTimer();
    let sheet: string;

    try {
      sheet = await withRetry(async () => {
        await paceGenerate();
        return timer.measure(async () =>
          collect(await interviewPrepStream(it.jobDescription, it.role)),
        );
      });
      latencies.push(timer.latencyMs);
    } catch (err) {
      const outcome = classify(err);

      // The API never answered: that says nothing about model quality, so the
      // item is excluded from every metric rather than scored zero.
      if (outcome.status === "api-error") {
        apiErrors.push(it.id);
        items.push({
          id: it.id,
          latencyMs: 0,
          scores: {},
          detail: `excluded — api error: ${outcome.error.message.slice(0, 80)}`,
        });
        continue;
      }

      // The model answered with nothing usable. That is a real model failure
      // and is scored, not dropped.
      judged++;
      relevance.push(0);
      grounded.push(0);
      actionable.push(0);
      structureValid.push(0);
      coverage.push(0);
      items.push({
        id: it.id,
        latencyMs: timer.latencyMs,
        scores: {
          relevance: 0,
          grounded: 0,
          actionable: 0,
          structureValid: 0,
          coverage: 0,
        },
        detail: `unusable output (${outcome.error.kind}): ${outcome.error.message.slice(0, 80)}`,
      });
      continue;
    }

    const parsed = parseSheet(sheet);
    const structOk = structureIsValid(parsed);
    const cover = answerKeyCoverage(parsed);

    try {
      const { rubric, tokens } = await withRetry(async () => {
        await paceGenerate();
        return judgeInterview(it.jobDescription, sheet);
      });
      judged++;
      relevance.push(rubric.relevance);
      grounded.push(rubric.grounded);
      actionable.push(rubric.actionable);
      structureValid.push(structOk ? 1 : 0);
      coverage.push(cover);
      judgeTokens.push(tokens);
      if (rubric.fabricated) fabricatedCount++;

      const structNote = structOk
        ? ""
        : `structure off (T:${parsed.technicalCount} B:${parsed.behavioralCount} Q:${parsed.interviewerCount}${parsed.hasMarkdownNoise ? " +markdown" : ""})`;
      const detail = [
        structNote,
        rubric.fabricated
          ? `fabricated: ${rubric.fabricatedItems.join(", ") || "(unspecified)"}`
          : "",
      ]
        .filter(Boolean)
        .join("; ");

      items.push({
        id: it.id,
        latencyMs: timer.latencyMs,
        scores: {
          relevance: rubric.relevance,
          grounded: rubric.grounded,
          actionable: rubric.actionable,
          structureValid: structOk ? 1 : 0,
          coverage: cover,
        },
        detail: detail || undefined,
      });
    } catch (err) {
      // The judge failed, not the model under test. Excluding is the only
      // honest option: we have an answer but no score for it.
      apiErrors.push(it.id);
      items.push({
        id: it.id,
        latencyMs: timer.latencyMs,
        scores: {},
        detail: `excluded — judge error: ${(err instanceof Error ? err.message : String(err)).slice(0, 80)}`,
      });
    }
  }

  const notes: string[] = [`Judge model: ${JUDGE_MODEL}.`];
  if (judgeIsSelfJudging()) {
    notes.push(
      `The judge is the same model as the one under test — scores are inflated by self-preference bias. Set EVAL_JUDGE_MODEL to a different model.`,
    );
  }
  if (apiErrors.length) {
    notes.push(
      `${apiErrors.length}/${data.length} items excluded after retries — the API or judge never returned a usable response (${apiErrors.join(", ")}). Metrics are over the ${judged} items actually scored.`,
    );
  }

  return {
    name,
    description:
      "Interview prep sheet, LLM-as-judge rubric (1-5) + structural validity + answer-key coverage + hallucination rate",
    n: judged,
    metrics: {
      "relevance /5": mean(relevance),
      "grounded /5": mean(grounded),
      "actionable /5": mean(actionable),
      "structure valid": judged ? mean(structureValid) : 0,
      "answer-key coverage": judged ? mean(coverage) : 0,
      "hallucination rate": judged ? fabricatedCount / judged : 0,
      "avg judge tokens": mean(judgeTokens),
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
