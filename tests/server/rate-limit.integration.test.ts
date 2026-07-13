import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// The unit tests mock $queryRaw, so the atomic upsert — the module's whole
// correctness claim — never actually runs there. This exercises the real SQL
// against a real Postgres. It's opt-in: without TEST_DATABASE_URL (e.g. the
// default no-DB CI) the whole suite skips rather than failing.
//
//   TEST_DATABASE_URL=postgresql://... npx vitest run tests/server/rate-limit.integration.test.ts
const url = process.env.TEST_DATABASE_URL;

// Swap the app's @/server/prisma for a plain pg client pointed at the
// test database. The factory constructs lazily, so it's harmless when skipped.
const prisma = url
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
  : null;
vi.mock("@/server/prisma", () => ({ prisma }));

const { rateLimit, deleteExpiredRateLimits } = await import(
  "@/server/rate-limit"
);

const describeDb = url ? describe : describe.skip;

describeDb("rateLimit against a real Postgres", () => {
  beforeAll(async () => {
    await prisma!.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "rate_limit" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL)`,
    );
  });

  afterAll(async () => {
    await prisma!.$disconnect();
  });

  beforeEach(async () => {
    await prisma!.rateLimit.deleteMany({});
  });

  it("counts sequential calls and denies once past the cap", async () => {
    const key = `it:seq:${Math.floor(performance.now())}`;
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await rateLimit(key, 3, 60_000));
    }
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
  });

  it("stays atomic under concurrent calls — exactly `max` succeed", async () => {
    const key = `it:conc:${Math.floor(performance.now())}`;
    const max = 5;
    const attempts = 20;
    const results = await Promise.all(
      Array.from({ length: attempts }, () => rateLimit(key, max, 60_000)),
    );
    const allowed = results.filter((r) => r.ok).length;
    // A non-atomic check-then-increment would let more than `max` through here.
    expect(allowed).toBe(max);
  });

  it("resets the count once the window has rolled over", async () => {
    const key = `it:roll:${Math.floor(performance.now())}`;
    const first = await rateLimit(key, 1, 1);
    expect(first.ok).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    const second = await rateLimit(key, 1, 1);
    expect(second.ok).toBe(true);
  });

  it("deleteExpiredRateLimits removes only closed windows", async () => {
    await rateLimit(`it:live:${Math.floor(performance.now())}`, 1, 60_000);
    await rateLimit(`it:dead:${Math.floor(performance.now())}`, 1, 1);
    await new Promise((r) => setTimeout(r, 20));
    const deleted = await deleteExpiredRateLimits();
    expect(deleted).toBeGreaterThanOrEqual(1);
    const remaining = await prisma!.rateLimit.findMany({});
    expect(remaining.every((r) => r.expiresAt.getTime() > Date.now())).toBe(
      true,
    );
  });
});
