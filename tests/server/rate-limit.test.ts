import { describe, it, expect, vi, beforeEach } from "vitest";

type Row = { count: number; expiresAt: Date };
const queryRaw = vi.fn<() => Promise<Row[]>>();
const deleteMany = vi.fn<() => Promise<{ count: number }>>();

vi.mock("@/server/prisma", () => ({
  prisma: { $queryRaw: queryRaw, rateLimit: { deleteMany } },
}));

// These tests mock $queryRaw, so they cover the decision logic around the query
// but never execute the upsert itself. Its atomicity and window rollover are
// covered against a real Postgres in rate-limit.integration.test.ts.
const {
  rateLimit,
  checkAiRateLimit,
  checkUploadRateLimit,
  deleteExpiredRateLimits,
  AI_RATE_MAX,
  UPLOAD_RATE_MAX,
} = await import("@/server/rate-limit");

const resetAt = new Date("2026-07-09T12:00:00Z");

beforeEach(() => {
  queryRaw.mockReset();
  deleteMany.mockReset();
});

describe("rateLimit", () => {
  it("allows the request that lands exactly on the cap", async () => {
    queryRaw.mockResolvedValue([{ count: 30, expiresAt: resetAt }]);
    await expect(rateLimit("k", 30, 1000)).resolves.toEqual({
      ok: true,
      resetAt,
    });
  });

  it("rejects the first request past the cap", async () => {
    queryRaw.mockResolvedValue([{ count: 31, expiresAt: resetAt }]);
    await expect(rateLimit("k", 30, 1000)).resolves.toEqual({
      ok: false,
      resetAt,
    });
  });

  it("allows a request after the window rolls and the count resets to 1", async () => {
    queryRaw.mockResolvedValue([{ count: 1, expiresAt: resetAt }]);
    const { ok } = await rateLimit("k", 30, 1000);
    expect(ok).toBe(true);
  });
});

describe("checkAiRateLimit", () => {
  it("namespaces the key per user and applies the shared AI budget", async () => {
    queryRaw.mockResolvedValue([{ count: AI_RATE_MAX, expiresAt: resetAt }]);
    await expect(checkAiRateLimit("user-1")).resolves.toBe(true);

    const [strings, ...values] = queryRaw.mock.calls[0] as unknown as [
      TemplateStringsArray,
      ...unknown[],
    ];
    expect(strings.join("?")).toContain("rate_limit");
    expect(values[0]).toBe("ai:user-1");
  });

  it("denies once the shared budget is exhausted", async () => {
    queryRaw.mockResolvedValue([
      { count: AI_RATE_MAX + 1, expiresAt: resetAt },
    ]);
    await expect(checkAiRateLimit("user-1")).resolves.toBe(false);
  });
});

describe("checkUploadRateLimit", () => {
  it("uses a key namespace separate from the AI budget", async () => {
    queryRaw.mockResolvedValue([{ count: UPLOAD_RATE_MAX, expiresAt: resetAt }]);
    await expect(checkUploadRateLimit("user-1")).resolves.toBe(true);

    const [, key] = queryRaw.mock.calls[0] as unknown as [
      TemplateStringsArray,
      string,
    ];
    expect(key).toBe("upload:user-1");
  });

  it("denies once the upload budget is exhausted", async () => {
    queryRaw.mockResolvedValue([
      { count: UPLOAD_RATE_MAX + 1, expiresAt: resetAt },
    ]);
    await expect(checkUploadRateLimit("user-1")).resolves.toBe(false);
  });
});

describe("deleteExpiredRateLimits", () => {
  it("deletes only rows whose window has already closed", async () => {
    deleteMany.mockResolvedValue({ count: 7 });
    await expect(deleteExpiredRateLimits()).resolves.toBe(7);

    const [args] = deleteMany.mock.calls[0] as unknown as [
      { where: { expiresAt: { lt: Date } } },
    ];
    expect(args.where.expiresAt.lt).toBeInstanceOf(Date);
  });
});
