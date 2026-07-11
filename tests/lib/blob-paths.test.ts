import { describe, it, expect } from "vitest";
import {
  resumeBlobPath,
  resumeBlobPrefix,
  safeBlobFilename,
} from "@/lib/blob-paths";

describe("safeBlobFilename", () => {
  it("keeps ordinary pdf names intact", () => {
    expect(safeBlobFilename("Jane_Doe-resume.v2.pdf")).toBe(
      "Jane_Doe-resume.v2.pdf",
    );
  });

  it("strips path separators so the name cannot escape its folder", () => {
    expect(safeBlobFilename("../../etc/passwd")).not.toContain("/");
    expect(safeBlobFilename("a/b/c.pdf")).not.toContain("/");
    expect(safeBlobFilename("..\\..\\win.pdf")).not.toContain("\\");
  });

  it("never begins with a dot", () => {
    expect(safeBlobFilename("../x.pdf").startsWith(".")).toBe(false);
    expect(safeBlobFilename("...pdf").startsWith(".")).toBe(false);
  });

  it("falls back to a default when nothing usable survives", () => {
    expect(safeBlobFilename("../")).toBe("resume.pdf");
    expect(safeBlobFilename("")).toBe("resume.pdf");
  });

  it("bounds the length", () => {
    expect(safeBlobFilename("a".repeat(500)).length).toBeLessThanOrEqual(120);
  });
});

describe("resumeBlobPath", () => {
  it("always stays under the user's prefix, even for hostile filenames", () => {
    const hostile = [
      "../../other-user/steal.pdf",
      "..%2f..%2fescape.pdf",
      "/absolute.pdf",
      "nested/dir/file.pdf",
    ];
    for (const name of hostile) {
      const path = resumeBlobPath("user-123", name);
      expect(path.startsWith(resumeBlobPrefix("user-123"))).toBe(true);
      expect(path.slice(resumeBlobPrefix("user-123").length)).not.toContain("/");
    }
  });

  it("scopes different users to different prefixes", () => {
    expect(resumeBlobPath("a", "cv.pdf")).toBe("resumes/a/cv.pdf");
    expect(resumeBlobPath("b", "cv.pdf")).toBe("resumes/b/cv.pdf");
  });
});
