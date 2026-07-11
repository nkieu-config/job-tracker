import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMany = vi.fn();
const deleteMany = vi.fn();
const findFirst = vi.fn();

vi.mock("@/server/prisma", () => ({
  prisma: { application: { updateMany, deleteMany, findFirst } },
}));

const getSession = vi.fn();
vi.mock("@/server/get-session", () => ({ getSession: () => getSession() }));

class RedirectError extends Error {}
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectError(to);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

class AiError extends Error {}
const analyzeJobDescription = vi.fn();
const embedText = vi.fn();
const embedDocument = vi.fn();
vi.mock("@/server/ai-client", () => ({
  analyzeJobDescription: (...a: unknown[]) => analyzeJobDescription(...a),
  embedText: (...a: unknown[]) => embedText(...a),
  embedDocument: (...a: unknown[]) => embedDocument(...a),
  AiError,
}));

const checkAiRateLimit = vi.fn();
vi.mock("@/server/rate-limit", () => ({
  checkAiRateLimit: () => checkAiRateLimit(),
}));

const matchSkillsSemantic = vi.fn();
vi.mock("@/server/semantic-skills", () => ({
  matchSkillsSemantic: (...a: unknown[]) => matchSkillsSemantic(...a),
}));

const getResumeTexts = vi.fn();
vi.mock("@/server/data/resumes", () => ({
  getResumeTexts: (...a: unknown[]) => getResumeTexts(...a),
}));

const saveJdEmbedding = vi.fn();
const saveResumeEmbedding = vi.fn();
const getResumesNeedingEmbedding = vi.fn();
vi.mock("@/server/data/embeddings", () => ({
  saveJdEmbedding: (...a: unknown[]) => saveJdEmbedding(...a),
  saveResumeEmbedding: (...a: unknown[]) => saveResumeEmbedding(...a),
  getResumesNeedingEmbedding: (...a: unknown[]) =>
    getResumesNeedingEmbedding(...a),
}));

// sha256("Senior TS role") — precomputed so the hash-skip test can pin a
// matching stored hash without importing the hashing module.
const JD_TEXT = "Senior TS role";
const { sha256 } = await import("@/server/hash");
const JD_HASH = sha256(JD_TEXT);
const { EMBEDDING_MODEL } = await import("@/server/ai/models");

const OWNER = "user-owner";
const {
  updateApplicationStatus,
  saveTailoredBullets,
  saveInterviewPrep,
  deleteApplication,
  analyzeApplication,
  computeResumeFit,
} = await import("@/actions/applications");

beforeEach(() => {
  updateMany.mockReset().mockResolvedValue({ count: 1 });
  deleteMany.mockReset().mockResolvedValue({ count: 1 });
  findFirst.mockReset();
  getSession.mockReset().mockResolvedValue({ user: { id: OWNER } });
  analyzeJobDescription.mockReset();
  embedText.mockReset().mockResolvedValue([0.1, 0.2]);
  embedDocument.mockReset().mockResolvedValue([0.3, 0.4]);
  checkAiRateLimit.mockReset().mockResolvedValue(true);
  matchSkillsSemantic.mockReset().mockResolvedValue({ matched: [] });
  getResumeTexts.mockReset().mockResolvedValue([]);
  saveJdEmbedding.mockReset().mockResolvedValue(undefined);
  saveResumeEmbedding.mockReset().mockResolvedValue(undefined);
  getResumesNeedingEmbedding.mockReset().mockResolvedValue([]);
});

const whereOf = (mock: typeof updateMany) => mock.mock.calls[0][0].where;

describe("ownership scoping", () => {
  it("scopes updateApplicationStatus to the caller's userId", async () => {
    await updateApplicationStatus("app-1", "OFFER");
    expect(whereOf(updateMany)).toEqual({ id: "app-1", userId: OWNER });
  });

  it("scopes saveTailoredBullets to the caller's userId", async () => {
    await saveTailoredBullets("app-1", "exp", "- bullet");
    expect(whereOf(updateMany)).toEqual({ id: "app-1", userId: OWNER });
  });

  it("scopes saveInterviewPrep to the caller's userId", async () => {
    await saveInterviewPrep("app-1", "prep");
    expect(whereOf(updateMany)).toEqual({ id: "app-1", userId: OWNER });
  });

  it("scopes deleteApplication to the caller's userId", async () => {
    await expect(deleteApplication("app-1")).rejects.toBeInstanceOf(
      RedirectError,
    );
    expect(whereOf(deleteMany)).toEqual({ id: "app-1", userId: OWNER });
  });
});

describe("another user's row", () => {
  it("reports not-found rather than succeeding when nothing matched", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(updateApplicationStatus("someone-elses", "OFFER")).resolves
      .toEqual({ error: "Application not found." });
    await expect(saveTailoredBullets("someone-elses", "e", "b")).resolves.toEqual(
      { error: "Application not found." },
    );
    await expect(saveInterviewPrep("someone-elses", "p")).resolves.toEqual({
      error: "Application not found.",
    });
  });
});

describe("unauthenticated callers", () => {
  it("redirects to sign-in before touching the database", async () => {
    getSession.mockResolvedValue(null);

    await expect(updateApplicationStatus("app-1", "OFFER")).rejects.toBeInstanceOf(
      RedirectError,
    );
    await expect(saveTailoredBullets("app-1", "e", "b")).rejects.toBeInstanceOf(
      RedirectError,
    );
    await expect(deleteApplication("app-1")).rejects.toBeInstanceOf(RedirectError);

    expect(updateMany).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });
});

describe("status validation", () => {
  it("rejects a status outside the enum without writing", async () => {
    const result = await updateApplicationStatus(
      "app-1",
      "DROP TABLE" as never,
    );
    expect(result).toEqual({ error: "Invalid status." });
    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe("analyzeApplication", () => {
  beforeEach(() => {
    findFirst.mockResolvedValue({
      id: "app-1",
      userId: OWNER,
      jobDescription: JD_TEXT,
    });
    analyzeJobDescription.mockResolvedValue({
      requiredSkills: ["TypeScript"],
      niceToHave: [],
      seniority: "senior",
      summary: "role",
    });
  });

  it("requires a job description before spending the AI budget", async () => {
    findFirst.mockResolvedValue({ id: "app-1", jobDescription: "  " });
    const res = await analyzeApplication("app-1", {}, new FormData());
    expect(res).toEqual({ error: "Add a job description before analyzing." });
    expect(checkAiRateLimit).not.toHaveBeenCalled();
    expect(analyzeJobDescription).not.toHaveBeenCalled();
  });

  it("returns the rate-limit error without calling the model", async () => {
    checkAiRateLimit.mockResolvedValue(false);
    const res = await analyzeApplication("app-1", {}, new FormData());
    expect(res.error).toMatch(/rate limit/i);
    expect(analyzeJobDescription).not.toHaveBeenCalled();
  });

  it("stores the analysis scoped to the caller and reports success", async () => {
    const res = await analyzeApplication("app-1", {}, new FormData());
    expect(res).toEqual({ success: true });
    const write = updateMany.mock.calls[0][0];
    expect(write.where).toEqual({ id: "app-1", userId: OWNER });
    expect(write.data.analysis.requiredSkills).toEqual(["TypeScript"]);
  });

  it("merges semantic skill matches when the user has resume text", async () => {
    getResumeTexts.mockResolvedValue([{ content: "I know TypeScript" }]);
    matchSkillsSemantic.mockResolvedValue({ matched: ["TypeScript"] });
    await analyzeApplication("app-1", {}, new FormData());
    const write = updateMany.mock.calls[0][0];
    expect(write.data.analysis.skillMatches).toEqual(["TypeScript"]);
  });

  it("surfaces an AiError message and writes nothing", async () => {
    analyzeJobDescription.mockRejectedValue(new AiError("model down"));
    const res = await analyzeApplication("app-1", {}, new FormData());
    expect(res).toEqual({ error: "model down" });
    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe("computeResumeFit", () => {
  beforeEach(() => {
    findFirst.mockResolvedValue({
      id: "app-1",
      userId: OWNER,
      jobDescription: JD_TEXT,
      jdEmbeddingHash: null,
      jdEmbeddingModel: null,
    });
    getResumeTexts.mockResolvedValue([{ id: "r-1", content: "resume text" }]);
    getResumesNeedingEmbedding.mockResolvedValue([
      { id: "r-1", content: "resume text" },
    ]);
  });

  it("requires a readable resume before embedding", async () => {
    getResumeTexts.mockResolvedValue([{ id: "r-1", content: "   " }]);
    const res = await computeResumeFit("app-1", {}, new FormData());
    expect(res.error).toMatch(/resume/i);
    expect(checkAiRateLimit).not.toHaveBeenCalled();
  });

  it("skips the AI call and budget when JD and resumes are already current", async () => {
    findFirst.mockResolvedValue({
      id: "app-1",
      userId: OWNER,
      jobDescription: JD_TEXT,
      jdEmbeddingHash: JD_HASH,
      jdEmbeddingModel: EMBEDDING_MODEL,
    });
    getResumesNeedingEmbedding.mockResolvedValue([]);
    const res = await computeResumeFit("app-1", {}, new FormData());
    expect(res).toEqual({ success: true });
    expect(checkAiRateLimit).not.toHaveBeenCalled();
    expect(embedText).not.toHaveBeenCalled();
  });

  it("re-embeds the JD when only the model changed", async () => {
    findFirst.mockResolvedValue({
      id: "app-1",
      userId: OWNER,
      jobDescription: JD_TEXT,
      jdEmbeddingHash: JD_HASH,
      jdEmbeddingModel: "some-old-model",
    });
    getResumesNeedingEmbedding.mockResolvedValue([]);
    await computeResumeFit("app-1", {}, new FormData());
    expect(embedText).toHaveBeenCalledWith(JD_TEXT, "RETRIEVAL_QUERY", OWNER);
    expect(saveJdEmbedding).toHaveBeenCalledWith(
      "app-1",
      OWNER,
      [0.1, 0.2],
      JD_HASH,
    );
  });

  it("embeds pending resumes and saves each scoped to the caller", async () => {
    findFirst.mockResolvedValue({
      id: "app-1",
      userId: OWNER,
      jobDescription: JD_TEXT,
      jdEmbeddingHash: JD_HASH,
      jdEmbeddingModel: EMBEDDING_MODEL,
    });
    const res = await computeResumeFit("app-1", {}, new FormData());
    expect(res).toEqual({ success: true });
    expect(embedText).not.toHaveBeenCalled();
    expect(embedDocument).toHaveBeenCalledWith(
      "resume text",
      "RETRIEVAL_DOCUMENT",
      OWNER,
    );
    expect(saveResumeEmbedding).toHaveBeenCalledWith("r-1", OWNER, [0.3, 0.4]);
  });

  it("returns the rate-limit error before any embedding work", async () => {
    checkAiRateLimit.mockResolvedValue(false);
    const res = await computeResumeFit("app-1", {}, new FormData());
    expect(res.error).toMatch(/rate limit/i);
    expect(embedText).not.toHaveBeenCalled();
    expect(embedDocument).not.toHaveBeenCalled();
  });
});
