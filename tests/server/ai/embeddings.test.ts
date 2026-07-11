import { describe, it, expect, vi, beforeEach } from "vitest";

const embedContent = vi.fn();

vi.mock("@/server/ai/gemini", () => ({
  getGeminiClient: () => ({ models: { embedContent } }),
  EMBEDDING_MODEL: "test-embedding-model",
}));

vi.mock("@/server/observability", () => ({ recordAiUsage: vi.fn() }));

const { embedTextBatch, embedDocument, EMBEDDING_DIM } = await import(
  "@/server/ai/embeddings"
);

function vectorFor(input: string): number[] {
  const values = new Array(EMBEDDING_DIM).fill(0);
  values[0] = Number(input);
  return values;
}

beforeEach(() => {
  embedContent.mockReset();
  embedContent.mockImplementation(
    ({ contents }: { contents: string[] }) => ({
      embeddings: contents.map((input) => ({ values: vectorFor(input) })),
    }),
  );
});

const indicesOf = (vectors: number[][]) => vectors.map((v) => v[0]);
const batchSizes = () =>
  embedContent.mock.calls.map((call) => call[0].contents.length);

describe("embedTextBatch", () => {
  it("returns nothing and makes no request for an empty input", async () => {
    const result = await embedTextBatch([]);

    expect(result).toEqual([]);
    expect(embedContent).not.toHaveBeenCalled();
  });

  it("sends a small batch as a single request", async () => {
    const result = await embedTextBatch(["0", "1", "2"]);

    expect(embedContent).toHaveBeenCalledTimes(1);
    expect(indicesOf(result)).toEqual([0, 1, 2]);
  });

  it("splits a batch that exceeds the per-request input count", async () => {
    const inputs = Array.from({ length: 20 }, (_, i) => String(i));
    const result = await embedTextBatch(inputs);

    expect(batchSizes()).toEqual([16, 4]);
    expect(indicesOf(result)).toEqual(inputs.map(Number));
  });

  it("splits a batch that exceeds the per-request character budget", async () => {
    // Each input is padded past the point where 8 of them would blow the
    // 60k-char budget, so the split happens on size rather than count.
    const inputs = Array.from(
      { length: 10 },
      (_, i) => String(i) + " ".repeat(7999),
    );
    const result = await embedTextBatch(inputs);

    expect(batchSizes()).toEqual([7, 3]);
    expect(indicesOf(result)).toEqual(inputs.map((_, i) => i));
  });

  it("preserves input order when a later batch resolves first", async () => {
    embedContent.mockImplementation(
      async ({ contents }: { contents: string[] }) => {
        const isFirstBatch = contents[0] === "0";
        await new Promise((resolve) =>
          setTimeout(resolve, isFirstBatch ? 20 : 0),
        );
        return { embeddings: contents.map((i) => ({ values: vectorFor(i) })) };
      },
    );

    const inputs = Array.from({ length: 20 }, (_, i) => String(i));
    const result = await embedTextBatch(inputs);

    expect(indicesOf(result)).toEqual(inputs.map(Number));
  });

  it("propagates the task type to every request", async () => {
    const inputs = Array.from({ length: 20 }, (_, i) => String(i));
    await embedTextBatch(inputs, "RETRIEVAL_DOCUMENT");

    for (const call of embedContent.mock.calls) {
      expect(call[0].config.taskType).toBe("RETRIEVAL_DOCUMENT");
    }
  });

  it("rejects a response whose vector has the wrong dimensionality", async () => {
    embedContent.mockResolvedValue({ embeddings: [{ values: [1, 2, 3] }] });

    await expect(embedTextBatch(["0"])).rejects.toThrow(/unexpected size/);
  });
});

describe("embedDocument", () => {
  it("embeds a short document as a single window (no pooling)", async () => {
    const result = await embedDocument("42");
    expect(embedContent).toHaveBeenCalledTimes(1);
    expect(embedContent.mock.calls[0][0].contents).toEqual(["42"]);
    expect(result[0]).toBe(42);
  });

  it("windows a long document on line boundaries and mean-pools the vectors", async () => {
    // Vectors keyed on the window's leading digit: line one → 2, line two → 4.
    embedContent.mockImplementation(
      ({ contents }: { contents: string[] }) => ({
        embeddings: contents.map((input) => ({
          values: vectorFor(input[0]),
        })),
      }),
    );
    // Two lines, each ~7k chars, so they can't share one 8k-char window.
    const line = (n: number) => String(n) + "a".repeat(7000);
    const doc = `${line(2)}\n${line(4)}`;
    const result = await embedDocument(doc);

    // Both windows were embedded...
    const sent = embedContent.mock.calls.flatMap((c) => c[0].contents);
    expect(sent).toHaveLength(2);
    // ...and the result is the L2-normalized mean. Only component 0 is nonzero
    // (2 and 4), so the pooled mean is 3 before normalization → 1 after.
    expect(result[0]).toBeCloseTo(1, 5);
  });

  it("defaults to the RETRIEVAL_DOCUMENT task type", async () => {
    await embedDocument("7");
    expect(embedContent.mock.calls[0][0].config.taskType).toBe(
      "RETRIEVAL_DOCUMENT",
    );
  });
});
