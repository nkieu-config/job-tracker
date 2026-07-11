# AI evaluation harness

Reproducible, metric-based evaluation of the app's Gemini features. Most
capstone projects wrap an LLM and hope; this measures whether the LLM actually
does what it claims, with numbers you can regenerate.

```bash
npm run eval                 # all suites
npm run eval jd-analysis     # one suite
npm run eval skill-match -- --n=5   # subset (fewer API calls)
```

Reads `.env` for `GEMINI_API_KEY`. Writes a scorecard to
`evals/reports/latest.{json,md}` and prints it to the console.

## What it measures

Three suites, each demonstrating a different evaluation technique.

### 1. `jd-analysis` — reference-based structured extraction

Runs `analyzeJobDescription` over hand-labeled job descriptions and scores the
extracted `requiredSkills` against a gold set.

- **Precision / Recall / F1** (macro-averaged) on skills, comparing *normalized*
  sets so `React.js` ≡ `react` and `postgres` ≡ `PostgreSQL`
  (see [`lib/normalize.ts`](lib/normalize.ts)).
- **Seniority accuracy** — exact-match on the `intern…lead` label.
- **Schema-valid rate** — fraction of responses that pass the Zod schema (the
  model is treated as untrusted input).

### 2. `skill-match` — controlled ablation (the RAG layer's lift)

Scores the same gold matched-skill set against two implementations:

- lexical only (`matchSkills` — word-boundary + alias), and
- lexical **+ embeddings** (`matchSkillsSemantic` — cosine similarity over
  resume chunks).

The gap is the semantic layer's contribution. The dataset deliberately includes
paraphrases (`"GitHub Actions pipelines"` for `CI/CD`, `"RESTful web endpoints"`
for `REST APIs`) that lexical matching misses.

### 3. `tailoring` — LLM-as-judge

Streams `tailorBulletsStream` output, then scores it with a **separate**
temperature-0 model call against a rubric (relevance / grounding / formatting,
1–5) and flags **hallucinations** — specific technologies or metrics not present
in the candidate's experience or the JD. Judge output is Zod-validated like any
other model response, and token usage is recorded for cost observability.

The judge defaults to a **different, stronger model** (`gemini-2.5-pro`) than the
one under test — a model judging its own output scores it leniently
(self-preference bias). Override with `EVAL_JUDGE_MODEL`; setting it equal to the
generation model is allowed but the report notes that the scores are
self-judged.

## Results

Run on `gemini-2.5-flash` + `gemini-embedding-001`; `npm run eval` regenerates.

| Suite | Measures | Status | Result |
| --- | --- | --- | --- |
| **skill-match** | embedding layer's lift over lexical-only matching (macro, n=12) | Captured | recall **86.1% → 94.4% (+8.3)**, F1 **90.5% → 95.5%**, precision 97.9% |
| **jd-analysis** | skill extraction P/R/F1 · seniority accuracy · schema-valid rate (n=15) | Captured | F1 **94.0%** (P 94.8% / R 93.4%), seniority accuracy **93.3%**, schema-valid **100%** |
| **tailoring** | LLM-as-judge relevance / grounding / formatting (1–5) · hallucination rate | Partial (3/6) | relevance / grounding / formatting **5 / 5 / 5**, hallucination rate **0%** on scored items |

> [!IMPORTANT]
> The Gemini **free tier caps generation at 20 requests/day**, and `jd-analysis`
> (15) + `tailoring` (6 gen + 6 judge) exceeds that in a single day — the
> tailoring run above hit the cap after 3 of 6 items, and the excluded items are
> reported as such, never silently scored. `skill-match` runs on the separate
> embeddings quota, so it captures in full. Use a paid key — or run one suite
> per day, or `-- --n=<k>` to subset — to fill the rest; the report writes
> itself.

### skill-match — the ablation, in detail

| Metric | Lexical only | Lexical + embeddings |
| --- | --- | --- |
| F1 | 90.5% | **95.5%** |
| Recall | 86.1% | **94.4%** |
| Precision | ~100% | 97.9% |

The embedding layer recovers paraphrased skills that lexical matching misses —
`observability` from “Prometheus metrics and Grafana dashboards”, `CI/CD` from
“GitHub Actions pipelines” — for **+8.3 points of recall** at a small precision
cost. That is the quantified justification for the semantic layer.

## Design notes

- **Rate limiting** ([`lib/pace.ts`](lib/pace.ts)) — the harness paces its own
  generation calls to stay under the free-tier per-minute limit, so the app's
  `server/ai` code never has to handle a 429. Override with `EVAL_RPM`.
- **A network failure is not a model failure** ([`lib/retry.ts`](lib/retry.ts)) —
  `AiError` carries a `kind` (`transport` · `timeout` · `empty` · `malformed` ·
  `schema`). Transport and timeout errors are retried with exponential backoff
  (`EVAL_MAX_ATTEMPTS`, total attempts, default 3); if they still fail, the item
  is **excluded from every metric** and reported in a note. Only `empty` /
  `malformed` / `schema` — the model answering with something unusable — is
  scored, counting against schema validity and the rubric/P/R/F1 means.
  `jd-analysis` and `tailoring` both apply this split. `skill-match` scores
  deterministic matchers instead, so it makes one preflight embedding call and
  fails loudly if the API is down — otherwise `matchSkillsSemantic`'s internal
  fallback would report a dead API as "the semantic layer adds no lift".
  Without this split, one 503 silently reads as "the model hallucinated",
  which is how eval harnesses quietly lie.
- **A partially-successful run is a failed run** — a suite that errors still
  lets the others print and write their report, but `npm run eval` exits
  non-zero so a broken suite cannot pass a CI gate unnoticed.
- **Quality thresholds gate the run** ([`lib/thresholds.ts`](lib/thresholds.ts))
  — after the infrastructure checks pass, each suite's headline metrics are
  compared against a committed floor (and a hallucination-rate ceiling). A prompt
  edit that halves F1 now exits non-zero instead of just printing a worse
  scorecard. They're regression alarms with headroom for model nondeterminism,
  not targets; raise them when a change genuinely moves the baseline up. An
  exploratory subset run scores too few items to be meaningful, so pass
  `-- --no-thresholds` (or use `-- --n=<k>`, which is exploratory by intent) to
  skip the gate.
- **Latency measures the model, not the pacer** ([`lib/timing.ts`](lib/timing.ts))
  — the reported timings wrap only the API call, excluding the rate-limiter's
  window wait and retry backoff, which on the free tier dwarf the real latency.
- **Pure metrics are unit-tested** in CI ([`../tests/evals/metrics.test.ts`](../tests/evals/metrics.test.ts))
  — the eval code itself is tested, no API required.
- **Datasets** are synthetic-but-realistic (`datasets/*.json`) to avoid scraping
  real postings and to keep gold labels defensible.
