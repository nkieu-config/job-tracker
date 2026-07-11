import { describe, it, expect, afterEach } from "vitest";
import { isAdminEmail } from "@/server/admin";

const original = process.env.ADMIN_EMAILS;
afterEach(() => {
  process.env.ADMIN_EMAILS = original;
});

describe("isAdminEmail", () => {
  it("denies everyone when the allowlist is unset or empty", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("someone@example.com")).toBe(false);
    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail("someone@example.com")).toBe(false);
    process.env.ADMIN_EMAILS = "  , ,  ";
    expect(isAdminEmail("someone@example.com")).toBe(false);
  });

  it("denies a missing email even when the allowlist has entries", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });

  it("matches case-insensitively and tolerates whitespace", () => {
    process.env.ADMIN_EMAILS = " Admin@Example.com , second@example.com ";
    expect(isAdminEmail("admin@example.com")).toBe(true);
    expect(isAdminEmail("ADMIN@EXAMPLE.COM")).toBe(true);
    expect(isAdminEmail("second@example.com")).toBe(true);
  });

  it("does not match on substrings or lookalikes", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdminEmail("admin@example.com.evil.com")).toBe(false);
    expect(isAdminEmail("notadmin@example.com")).toBe(false);
    expect(isAdminEmail("admin@example.co")).toBe(false);
  });
});
