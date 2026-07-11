import { describe, it, expect, vi, beforeEach } from "vitest";
import { MAX_RESUME_BYTES } from "@/lib/schemas/resume";

const getSession = vi.fn();
vi.mock("@/server/get-session", () => ({ getSession: () => getSession() }));

const create = vi.fn();
const count = vi.fn();
vi.mock("@/server/prisma", () => ({
  prisma: { resumeVersion: { create, count } },
}));

const checkUploadRateLimit = vi.fn();
vi.mock("@/server/rate-limit", () => ({
  checkUploadRateLimit: () => checkUploadRateLimit(),
}));

const put = vi.fn();
const del = vi.fn();
vi.mock("@vercel/blob", () => ({
  put: (...a: unknown[]) => put(...a),
  del: (...a: unknown[]) => del(...a),
}));

const extractPdfText = vi.fn();
class PdfTooLongError extends Error {
  constructor(readonly pages: number) {
    super(`This PDF has ${pages} pages (max 50).`);
  }
}
vi.mock("@/server/pdf", () => ({
  extractPdfText: (...a: unknown[]) => extractPdfText(...a),
  PdfTooLongError,
}));

// Imported after the mock factories run — a static import would pull in
// @/server/prisma before `create` is initialized.
const { POST } = await import("@/app/api/resumes/route");
const { MAX_RESUME_VERSIONS } = await import("@/server/data/resumes");

function upload(file: File | null, label = "My resume"): Request {
  const fd = new FormData();
  fd.set("label", label);
  if (file) fd.set("file", file);
  return new Request("http://test/api/resumes", { method: "POST", body: fd });
}

const pdf = (bytes: string, name = "cv.pdf") =>
  new File([bytes], name, { type: "application/pdf" });

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ user: { id: "user-1" } });
  create.mockReset().mockResolvedValue({ id: "resume-1" });
  count.mockReset().mockResolvedValue(0);
  checkUploadRateLimit.mockReset().mockResolvedValue(true);
  put.mockReset().mockResolvedValue({ url: "https://blob/resumes/user-1/cv.pdf" });
  del.mockReset().mockResolvedValue(undefined);
  extractPdfText.mockReset().mockResolvedValue("resume text");
});

describe("POST /api/resumes auth", () => {
  it("rejects an unauthenticated upload before reading the body", async () => {
    getSession.mockResolvedValue(null);
    const res = await POST(upload(pdf("%PDF-1.7 ok")));
    expect(res.status).toBe(401);
    expect(put).not.toHaveBeenCalled();
    expect(checkUploadRateLimit).not.toHaveBeenCalled();
  });
});

describe("POST /api/resumes cost limits", () => {
  it("rejects with 429 once the upload rate limit is exhausted", async () => {
    checkUploadRateLimit.mockResolvedValue(false);
    const res = await POST(upload(pdf("%PDF-1.7 ok")));
    expect(res.status).toBe(429);
    expect(extractPdfText).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects with 409 once the per-user version cap is reached", async () => {
    count.mockResolvedValue(MAX_RESUME_VERSIONS);
    const res = await POST(upload(pdf("%PDF-1.7 ok")));
    expect(res.status).toBe(409);
    expect(put).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("allows the upload that lands exactly on the cap boundary", async () => {
    count.mockResolvedValue(MAX_RESUME_VERSIONS - 1);
    const res = await POST(upload(pdf("%PDF-1.7 ok")));
    expect(res.status).toBe(201);
  });

  it("counts only the caller's own versions", async () => {
    await POST(upload(pdf("%PDF-1.7 ok")));
    expect(count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });
});

describe("POST /api/resumes validation", () => {
  it("rejects a request with no file part", async () => {
    const res = await POST(upload(null));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a missing label", async () => {
    const res = await POST(upload(pdf("%PDF-1.7 ok"), "   "));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects an over-long label", async () => {
    const res = await POST(upload(pdf("%PDF-1.7 ok"), "L".repeat(101)));
    expect(res.status).toBe(400);
  });

  it("rejects an empty file", async () => {
    const res = await POST(upload(pdf("")));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects an oversize file with 413", async () => {
    const big = new File(["x".repeat(MAX_RESUME_BYTES + 1)], "cv.pdf", {
      type: "application/pdf",
    });
    const res = await POST(upload(big));
    expect(res.status).toBe(413);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a non-pdf declared content type with 415", async () => {
    const txt = new File(["%PDF-1.7"], "cv.txt", { type: "text/plain" });
    const res = await POST(upload(txt));
    expect(res.status).toBe(415);
  });

  it("rejects a spoofed content type whose bytes are not a PDF with 415", async () => {
    const res = await POST(upload(pdf("<html>gotcha</html>")));
    expect(res.status).toBe(415);
    expect(extractPdfText).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a PDF with too many pages with 413 and never uploads it", async () => {
    extractPdfText.mockRejectedValue(new PdfTooLongError(5000));
    const res = await POST(upload(pdf("%PDF-1.7 huge")));
    expect(res.status).toBe(413);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects an unparseable PDF with 422 and never uploads it", async () => {
    extractPdfText.mockRejectedValue(new Error("corrupt"));
    const res = await POST(upload(pdf("%PDF-1.7 broken")));
    expect(res.status).toBe(422);
    expect(put).not.toHaveBeenCalled();
  });
});

describe("POST /api/resumes blob lifecycle", () => {
  it("stores the blob under the caller's prefix with a sanitized name", async () => {
    await POST(upload(pdf("%PDF-1.7 ok", "../../other/evil.pdf")));
    const [path] = put.mock.calls[0];
    expect(path.startsWith("resumes/user-1/")).toBe(true);
    expect(path.slice("resumes/user-1/".length)).not.toContain("/");
  });

  it("returns 502 when the blob upload itself fails", async () => {
    put.mockRejectedValue(new Error("blob down"));
    const res = await POST(upload(pdf("%PDF-1.7 ok")));
    expect(res.status).toBe(502);
    expect(create).not.toHaveBeenCalled();
  });

  it("deletes the blob when the database insert fails, leaving no orphan", async () => {
    create.mockRejectedValue(new Error("db down"));
    await expect(POST(upload(pdf("%PDF-1.7 ok")))).rejects.toThrow("db down");
    expect(del).toHaveBeenCalledWith("https://blob/resumes/user-1/cv.pdf");
  });

  it("still surfaces the database error when the compensating delete also fails", async () => {
    create.mockRejectedValue(new Error("db down"));
    del.mockRejectedValue(new Error("blob delete down"));
    await expect(POST(upload(pdf("%PDF-1.7 ok")))).rejects.toThrow("db down");
  });

  it("creates the row and returns 201 on the happy path", async () => {
    const res = await POST(upload(pdf("%PDF-1.7 ok")));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "resume-1" });
    expect(del).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].data.userId).toBe("user-1");
  });
});
