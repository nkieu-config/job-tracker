import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
vi.mock("@/server/prisma", () => ({
  prisma: { application: { findFirst } },
}));

const getSession = vi.fn();
vi.mock("@/server/get-session", () => ({ getSession: () => getSession() }));

const checkAiRateLimit = vi.fn();
vi.mock("@/server/rate-limit", () => ({
  checkAiRateLimit: () => checkAiRateLimit(),
}));

const tailorBulletsStream = vi.fn();
const interviewPrepStream = vi.fn();
vi.mock("@/server/ai-client", () => ({
  tailorBulletsStream: (...a: unknown[]) => tailorBulletsStream(...a),
  interviewPrepStream: (...a: unknown[]) => interviewPrepStream(...a),
}));

const { POST: tailorPOST } = await import(
  "@/app/api/applications/[id]/tailor/route"
);
const { POST: interviewPOST } = await import(
  "@/app/api/applications/[id]/interview/route"
);

const OWNER = "user-owner";
const params = (id: string) => ({ params: Promise.resolve({ id }) });

function req(body?: unknown): Request {
  return new Request("http://test/api/applications/app-1/x", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function okStream(): Response {
  return new Response("- generated", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ user: { id: OWNER } });
  findFirst
    .mockReset()
    .mockResolvedValue({ jobDescription: "Senior TS role", role: "Engineer" });
  checkAiRateLimit.mockReset().mockResolvedValue(true);
  tailorBulletsStream.mockReset().mockResolvedValue(okStream());
  interviewPrepStream.mockReset().mockResolvedValue(okStream());
});

describe("POST /api/applications/[id]/tailor", () => {
  it("rejects an unauthenticated caller before any DB or AI work", async () => {
    getSession.mockResolvedValue(null);
    const res = await tailorPOST(req({ experience: "x" }), params("app-1"));
    expect(res.status).toBe(401);
    expect(findFirst).not.toHaveBeenCalled();
    expect(tailorBulletsStream).not.toHaveBeenCalled();
  });

  it("scopes the application lookup to the caller and 404s on a miss", async () => {
    findFirst.mockResolvedValue(null);
    const res = await tailorPOST(req({ experience: "x" }), params("someone-elses"));
    expect(res.status).toBe(404);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "someone-elses",
      userId: OWNER,
    });
    expect(checkAiRateLimit).not.toHaveBeenCalled();
  });

  it("requires a job description", async () => {
    findFirst.mockResolvedValue({ jobDescription: "   " });
    const res = await tailorPOST(req({ experience: "x" }), params("app-1"));
    expect(res.status).toBe(400);
  });

  it("requires an experience body", async () => {
    const res = await tailorPOST(req({ experience: "  " }), params("app-1"));
    expect(res.status).toBe(400);
    expect(checkAiRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 once the AI budget is spent, without calling the model", async () => {
    checkAiRateLimit.mockResolvedValue(false);
    const res = await tailorPOST(req({ experience: "x" }), params("app-1"));
    expect(res.status).toBe(429);
    expect(tailorBulletsStream).not.toHaveBeenCalled();
  });

  it("streams the model output on the happy path", async () => {
    const res = await tailorPOST(req({ experience: "x" }), params("app-1"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("- generated");
  });

  it("propagates an upstream AI failure status", async () => {
    tailorBulletsStream.mockResolvedValue(
      new Response("AI is not configured.", { status: 503 }),
    );
    const res = await tailorPOST(req({ experience: "x" }), params("app-1"));
    expect(res.status).toBe(503);
  });
});

describe("POST /api/applications/[id]/interview", () => {
  it("rejects an unauthenticated caller", async () => {
    getSession.mockResolvedValue(null);
    const res = await interviewPOST(req(), params("app-1"));
    expect(res.status).toBe(401);
    expect(interviewPrepStream).not.toHaveBeenCalled();
  });

  it("scopes the lookup to the caller and 404s on a miss", async () => {
    findFirst.mockResolvedValue(null);
    const res = await interviewPOST(req(), params("someone-elses"));
    expect(res.status).toBe(404);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "someone-elses",
      userId: OWNER,
    });
  });

  it("returns 429 once the AI budget is spent", async () => {
    checkAiRateLimit.mockResolvedValue(false);
    const res = await interviewPOST(req(), params("app-1"));
    expect(res.status).toBe(429);
    expect(interviewPrepStream).not.toHaveBeenCalled();
  });

  it("streams the model output on the happy path", async () => {
    const res = await interviewPOST(req(), params("app-1"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("- generated");
  });
});
