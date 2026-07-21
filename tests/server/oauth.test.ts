import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { enabledOAuthProviders, socialProvidersConfig } from "@/server/oauth";

const OAUTH_ENV = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(OAUTH_ENV.map((k) => [k, process.env[k]]));
  for (const key of OAUTH_ENV) delete process.env[key];
});

afterEach(() => {
  for (const key of OAUTH_ENV) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("enabledOAuthProviders", () => {
  it("offers no provider when nothing is configured", () => {
    expect(enabledOAuthProviders()).toEqual([]);
    expect(socialProvidersConfig()).toEqual({});
  });

  it("offers a provider only when both of its secrets are present", () => {
    process.env.GITHUB_CLIENT_ID = "gh-id";
    expect(enabledOAuthProviders()).toEqual([]);

    process.env.GITHUB_CLIENT_SECRET = "gh-secret";
    expect(enabledOAuthProviders()).toEqual(["github"]);
  });

  it("treats an empty-string secret as unset", () => {
    process.env.GOOGLE_CLIENT_ID = "google-id";
    process.env.GOOGLE_CLIENT_SECRET = "";
    expect(enabledOAuthProviders()).toEqual([]);
  });

  it("enables each provider independently and keeps a stable order", () => {
    process.env.GOOGLE_CLIENT_ID = "g-id";
    process.env.GOOGLE_CLIENT_SECRET = "g-secret";
    process.env.GITHUB_CLIENT_ID = "gh-id";
    process.env.GITHUB_CLIENT_SECRET = "gh-secret";
    expect(enabledOAuthProviders()).toEqual(["github", "google"]);
  });
});

describe("socialProvidersConfig", () => {
  it("passes only the configured providers' credentials to Better Auth", () => {
    process.env.GITHUB_CLIENT_ID = "gh-id";
    process.env.GITHUB_CLIENT_SECRET = "gh-secret";

    const config = socialProvidersConfig();

    expect(config).toEqual({
      github: { clientId: "gh-id", clientSecret: "gh-secret" },
    });
    expect(config.google).toBeUndefined();
  });
});
