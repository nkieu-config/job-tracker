import { describe, it, expect, vi, beforeEach } from "vitest";

const getApplication = vi.fn();
vi.mock("@/server/data/applications", () => ({
  getApplication: (...a: unknown[]) => getApplication(...a),
}));

const checkAiRateLimit = vi.fn();
vi.mock("@/server/rate-limit", () => ({
  checkAiRateLimit: (...a: unknown[]) => checkAiRateLimit(...a),
}));

const { requireApplicationWithJd, requireAiBudget, guardAiRequest } =
  await import("@/server/ai-guard");

beforeEach(() => {
  getApplication.mockReset();
  checkAiRateLimit.mockReset().mockResolvedValue(true);
});

describe("requireApplicationWithJd", () => {
  // The guard must not carry its own copy of the ownership predicate — that is
  // exactly how two call sites drift into two different definitions of "mine".
  it("reads through the data layer, scoped to the caller", async () => {
    getApplication.mockResolvedValue({
      id: "a1",
      jobDescription: "Senior Go engineer",
    });

    const result = await requireApplicationWithJd("a1", "user-1", "analyzing");

    expect(getApplication).toHaveBeenCalledWith("a1", "user-1");
    expect(result).toMatchObject({
      ok: true,
      jobDescription: "Senior Go engineer",
    });
  });

  it("denies with 404 when the application is not the caller's", async () => {
    getApplication.mockResolvedValue(null);

    await expect(
      requireApplicationWithJd("a1", "user-1", "analyzing"),
    ).resolves.toEqual({
      ok: false,
      denial: { message: "Application not found.", status: 404 },
    });
  });

  it("denies with 400 when the job description is only whitespace", async () => {
    getApplication.mockResolvedValue({ id: "a1", jobDescription: "  \n " });

    await expect(
      requireApplicationWithJd("a1", "user-1", "analyzing"),
    ).resolves.toEqual({
      ok: false,
      denial: {
        message: "Add a job description before analyzing.",
        status: 400,
      },
    });
  });
});

describe("guardAiRequest", () => {
  it("checks the budget only after ownership and input pass", async () => {
    getApplication.mockResolvedValue(null);

    const result = await guardAiRequest("a1", "user-1", { verb: "tailoring" });

    expect(result.ok).toBe(false);
    expect(checkAiRateLimit).not.toHaveBeenCalled();
  });

  it("denies with 429 once the budget is spent", async () => {
    getApplication.mockResolvedValue({
      id: "a1",
      jobDescription: "Go engineer",
    });
    checkAiRateLimit.mockResolvedValue(false);

    const result = await guardAiRequest("a1", "user-1", { verb: "tailoring" });

    expect(result).toEqual({
      ok: false,
      denial: {
        message: "AI rate limit reached. Please try again later.",
        status: 429,
      },
    });
  });
});

describe("requireAiBudget", () => {
  it("returns null while the caller still has budget", async () => {
    await expect(requireAiBudget("user-1")).resolves.toBeNull();
  });
});
