export type OAuthProviderId = "github" | "google";

export type OAuthProvider = {
  id: OAuthProviderId;
  label: string;
};

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
];
