import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();
vi.mock("@/server/get-session", () => ({ getSession: () => getSession() }));

const getResumeFileUrl = vi.fn();
vi.mock("@/server/data/resumes", () => ({
  getResumeFileUrl: (...a: unknown[]) => getResumeFileUrl(...a),
}));

const get = vi.fn();
vi.mock("@vercel/blob", () => ({ get: (...a: unknown[]) => get(...a) }));

const { GET } = await import("@/app/api/resumes/[id]/file/route");

const OWNER = "user-owner";
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const request = new Request("http://test/api/resumes/r-1/file");

function blobHit() {
  return {
    statusCode: 200,
    stream: new ReadableStream(),
    blob: { contentType: "application/pdf", size: 1234 },
  };
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ user: { id: OWNER } });
  getResumeFileUrl
    .mockReset()
    .mockResolvedValue({ fileUrl: "https://blob/resumes/user-owner/cv.pdf" });
  get.mockReset().mockResolvedValue(blobHit());
});

describe("GET /api/resumes/[id]/file", () => {
  it("rejects an unauthenticated caller before touching the blob store", async () => {
    getSession.mockResolvedValue(null);
    const res = await GET(request, params("r-1"));
    expect(res.status).toBe(401);
    expect(getResumeFileUrl).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it("scopes the lookup to the caller so another user's resume 404s", async () => {
    getResumeFileUrl.mockResolvedValue(null);
    const res = await GET(request, params("someone-elses"));
    expect(res.status).toBe(404);
    expect(getResumeFileUrl).toHaveBeenCalledWith("someone-elses", OWNER);
    // Never reach for the bytes when ownership doesn't match.
    expect(get).not.toHaveBeenCalled();
  });

  it("404s when the row exists but has no stored file", async () => {
    getResumeFileUrl.mockResolvedValue({ fileUrl: null });
    const res = await GET(request, params("r-1"));
    expect(res.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  it("404s when the private blob can't be fetched", async () => {
    get.mockResolvedValue({ statusCode: 404 });
    const res = await GET(request, params("r-1"));
    expect(res.status).toBe(404);
  });

  it("streams the PDF inline with a private, no-store cache policy", async () => {
    const res = await GET(request, params("r-1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe("inline");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(get).toHaveBeenCalledWith(
      "https://blob/resumes/user-owner/cv.pdf",
      { access: "private" },
    );
  });
});
