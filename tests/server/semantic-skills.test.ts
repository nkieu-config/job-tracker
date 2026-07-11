import { describe, it, expect, vi, beforeEach } from "vitest";

const embedTexts = vi.fn();
vi.mock("@/server/ai-client", () => ({ embedTexts: (...a: unknown[]) => embedTexts(...a) }));

const chunkText = vi.fn();
vi.mock("@/lib/skills", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/skills")>();
  return {
    ...actual,
    chunkText: (...a: Parameters<typeof actual.chunkText>) =>
      chunkText.getMockImplementation() ? chunkText(...a) : actual.chunkText(...a),
  };
});

const { matchSkillsSemantic } = await import("@/server/semantic-skills");

const RESUME = "Built data pipelines in Golang and shipped gRPC services.";

beforeEach(() => {
  embedTexts.mockReset();
  chunkText.mockReset();
});

describe("matchSkillsSemantic", () => {
  it("falls back to the lexical result when embedding fails", async () => {
    embedTexts.mockRejectedValue(new Error("gemini down"));
    const result = await matchSkillsSemantic(["Golang", "Kubernetes"], RESUME);

    expect(result.matched).toContain("Golang");
    expect(result.missing).toContain("Kubernetes");
  });

  it("never calls the embedding API when nothing is lexically missing", async () => {
    await matchSkillsSemantic(["Golang"], RESUME);
    expect(embedTexts).not.toHaveBeenCalled();
  });

  it("never calls the embedding API for an empty resume", async () => {
    const result = await matchSkillsSemantic(["Golang"], "   ");
    expect(embedTexts).not.toHaveBeenCalled();
    expect(result.missing).toContain("Golang");
  });

  it("never calls the embedding API when the resume yields no chunks", async () => {
    chunkText.mockImplementation(() => []);
    const result = await matchSkillsSemantic(["Kubernetes"], RESUME);

    expect(embedTexts).not.toHaveBeenCalled();
    expect(result.missing).toContain("Kubernetes");
  });

  it("promotes a missing skill to matched when similarity clears the threshold", async () => {
    // identical unit vectors -> cosine similarity 1.0, above the 0.83 threshold
    embedTexts.mockResolvedValue([[1, 0, 0]]);
    const result = await matchSkillsSemantic(["Kubernetes"], RESUME);

    expect(result.matched).toContain("Kubernetes");
    expect(result.missing).not.toContain("Kubernetes");
  });

  it("leaves a missing skill missing when similarity is below the threshold", async () => {
    // orthogonal vectors -> cosine similarity 0, below the 0.83 threshold
    embedTexts
      .mockResolvedValueOnce([[1, 0, 0]])
      .mockResolvedValueOnce([[0, 1, 0]]);
    const result = await matchSkillsSemantic(["Kubernetes"], RESUME);

    expect(result.missing).toContain("Kubernetes");
    expect(result.matched).not.toContain("Kubernetes");
  });
});
