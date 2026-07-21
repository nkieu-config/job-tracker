import "server-only";

import { OAUTH_PROVIDERS, type OAuthProviderId } from "@/lib/oauth-providers";

type ProviderCredentials = { clientId: string; clientSecret: string };

const CREDENTIALS: Record<OAuthProviderId, () => Partial<ProviderCredentials>> = {
  github: () => ({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }),
  google: () => ({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
};

function readCredentials(id: OAuthProviderId): ProviderCredentials | null {
  const { clientId, clientSecret } = CREDENTIALS[id]();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// A provider is offered only when both of its secrets are present, so an
// unconfigured deployment silently omits the button instead of surfacing a
// dead OAuth flow. Evaluated per-call rather than cached: cheap, and it keeps
// tests free to vary the environment.
export function enabledOAuthProviders(): OAuthProviderId[] {
  return OAUTH_PROVIDERS.map((p) => p.id).filter((id) => readCredentials(id) !== null);
}

export function socialProvidersConfig(): Partial<
  Record<OAuthProviderId, ProviderCredentials>
> {
  const config: Partial<Record<OAuthProviderId, ProviderCredentials>> = {};
  for (const id of enabledOAuthProviders()) {
    const credentials = readCredentials(id);
    if (credentials) config[id] = credentials;
  }
  return config;
}
