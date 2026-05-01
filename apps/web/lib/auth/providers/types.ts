export type AuthProviderId = "google";

export type AuthProviderProfile = {
  provider: AuthProviderId;
  providerSubject: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuthProvider = {
  id: AuthProviderId;
  getAuthorizationUrl(origin: string, state: string): URL;
  exchangeCodeForProfile(
    code: string,
    origin: string,
  ): Promise<AuthProviderProfile>;
};
