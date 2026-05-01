import { randomBytes } from "node:crypto";
import type { AuthProvider, AuthProviderProfile } from "./types";

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

function getGoogleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  return { clientId, clientSecret };
}

function getRedirectUri(origin: string) {
  return `${origin}/oauth/google/callback`;
}

async function exchangeCodeForProfile(
  code: string,
  origin: string,
): Promise<AuthProviderProfile> {
  const { clientId, clientSecret } = getGoogleEnv();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(origin),
    }),
  });

  const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description ?? tokenJson.error ?? "token_error");
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      authorization: `Bearer ${tokenJson.access_token}`,
    },
  });

  if (!userInfoResponse.ok) {
    throw new Error("userinfo_error");
  }

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

  if (!userInfo.sub || !userInfo.email) {
    throw new Error("missing_google_profile");
  }

  return {
    provider: "google",
    providerSubject: userInfo.sub,
    email: userInfo.email,
    displayName: userInfo.name ?? null,
    avatarUrl: userInfo.picture ?? null,
  };
}

export function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

export const googleProvider: AuthProvider = {
  id: "google",
  getAuthorizationUrl(origin, state) {
    const { clientId } = getGoogleEnv();
    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", getRedirectUri(origin));
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("prompt", "select_account");

    return authorizationUrl;
  },
  exchangeCodeForProfile,
};
