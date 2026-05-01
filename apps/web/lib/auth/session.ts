import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const sessionCookieName = "dear_hoomin_session";
const oauthStateCookieName = "dear_hoomin_oauth_state";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 14;
const oauthStateMaxAgeSeconds = 60 * 10;

export type AuthSession = {
  hoominId: string;
  email: string;
  name: string | null;
  picture: string | null;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be at least 32 characters");
  }

  return secret;
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function sign(value: string) {
  return toBase64Url(
    createHmac("sha256", getSessionSecret()).update(value).digest(),
  );
}

function encodeSession(session: AuthSession) {
  const payload = toBase64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string): AuthSession | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return null;
  }

  const session = JSON.parse(fromBase64Url(payload)) as AuthSession;

  if (!session.expiresAt || session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(sessionCookieName)?.value;

  if (!cookieValue) {
    return null;
  }

  try {
    return decodeSession(cookieValue);
  } catch {
    return null;
  }
}

export async function setSession(
  session: Omit<AuthSession, "expiresAt">,
) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;

  cookieStore.set(sessionCookieName, encodeSession({ ...session, expiresAt }), {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function setOAuthState(state: string) {
  const cookieStore = await cookies();
  cookieStore.set(oauthStateCookieName, state, {
    httpOnly: true,
    maxAge: oauthStateMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function consumeOAuthState() {
  const cookieStore = await cookies();
  const state = cookieStore.get(oauthStateCookieName)?.value ?? null;
  cookieStore.delete(oauthStateCookieName);
  return state;
}
