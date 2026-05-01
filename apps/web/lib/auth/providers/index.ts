import { googleProvider } from "./google";
import type { AuthProvider, AuthProviderId } from "./types";

const authProviders = {
  google: googleProvider,
} satisfies Record<AuthProviderId, AuthProvider>;

export function getAuthProvider(providerId: AuthProviderId) {
  return authProviders[providerId];
}

export { createOAuthState } from "./google";
export type { AuthProviderId, AuthProviderProfile } from "./types";
