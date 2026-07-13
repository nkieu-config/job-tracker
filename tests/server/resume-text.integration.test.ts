import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// The unit tests mock $queryRaw, so the "does this resume hold readable text?"
// predicate — raw SQL in three queries — never actually runs there. It shipped
// once as `length(trim(content)) > 0`, which looks right and isn't: Postgres
// `trim` strips spaces but NOT newlines or tabs, so a scanned PDF extracting to
// "\n\n\n" counted as having text, while the JavaScript `.trim()` every caller
// compares against says it doesn't. Only a real Postgres can catch that.
//
// Opt-in, like the rate-limit integration suite: without TEST_DATABASE_URL the
// whole file skips rather than failing.
//
//   TEST_DATABASE_URL=postgresql://... npx vitest run tests/server/resume-text.integration.test.ts
const url = process.env.TEST_DATABASE_URL;

const prisma = url
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
  : null;
vi.mock("@/server/prisma", () => ({ prisma }));

const { getResumeTextMeta, hasResumeWithText, getResumeText } = await import(
  "@/server/data/resumes"
);
const { getResumesNeedingEmbedding } = await import("@/server/data/embeddings");

const describeDb = url ? describe : describe.skip;

const USER = "resume-text-it-user";

// Every content shape a PDF extraction can realistically produce, paired with
// the answer JavaScript's `.trim()` would give — the semantics the callers want.
const SHAPES: { id: string; content: string | null; hasText: boolean }[] = [
  { id: "it-null", content: null, hasText: false },
  { id: "it-empty", content: "", hasText: false },
  { id: "it-spaces", content: "     ", hasText: false },
  { id: "it-newlines", content: "\n\n\n", hasText: false },
  { id: "it-tabs-crlf", content: " \t\r\n ", hasText: false },
  { id: "it-real", content: "Senior TypeScript engineer", hasText: true },
  { id: "it-padded", content: "\n  Senior engineer  \n", hasText: true },
];

describeDb("resume text predicate against a real Postgres", () => {
  // `resume_version.userId` is a real foreign key, so the rows need an owner.
  // This user exists only for this suite and is removed with it — the fixtures
  // are scoped to its id, so a shared test database keeps its other rows.
  beforeAll(async () => {
    await prisma!.user.upsert({
      where: { id: USER },
      update: {},
      create: {
        id: USER,
        name: "Resume text integration",
        email: `${USER}@example.test`,
      },
    });
  });

  afterAll(async () => {
    await prisma!.resumeVersion.deleteMany({ where: { userId: USER } });
    await prisma!.user.deleteMany({ where: { id: USER } });
    await prisma!.$disconnect();
  });

  beforeEach(async () => {
    await prisma!.resumeVersion.deleteMany({ where: { userId: USER } });
    // Insert oldest-first so `createdAt DESC` has a stable order to return.
    for (const [i, shape] of SHAPES.entries()) {
      await prisma!.resumeVersion.create({
        data: {
          id: shape.id,
          userId: USER,
          label: shape.id,
          content: shape.content,
          createdAt: new Date(Date.now() + i * 1000),
        },
      });
    }
  });

  it("agrees with JavaScript's .trim() on every content shape", async () => {
    const meta = await getResumeTextMeta(USER);

    const actual = Object.fromEntries(meta.map((m) => [m.id, m.hasText]));
    const expected = Object.fromEntries(SHAPES.map((s) => [s.id, s.hasText]));
    expect(actual).toEqual(expected);
  });

  it("returns real booleans and Dates, not strings", async () => {
    const [row] = await getResumeTextMeta(USER);

    expect(typeof row.hasText).toBe("boolean");
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("never offers a whitespace-only resume up for embedding", async () => {
    const pending = await getResumesNeedingEmbedding(USER);

    expect(pending.map((p) => p.id).sort()).toEqual(["it-padded", "it-real"]);
  });

  it("reports no readable text when every resume is whitespace", async () => {
    await prisma!.resumeVersion.deleteMany({
      where: { userId: USER, id: { in: ["it-real", "it-padded"] } },
    });

    await expect(hasResumeWithText(USER)).resolves.toBe(false);
  });

  it("reports readable text once one resume has any", async () => {
    await expect(hasResumeWithText(USER)).resolves.toBe(true);
  });

  it("joins the corpus newest-first", async () => {
    const text = await getResumeText(USER);

    expect(text.indexOf("Senior engineer")).toBeLessThan(
      text.indexOf("Senior TypeScript engineer"),
    );
  });
});
