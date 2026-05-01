import { createHmac } from "node:crypto";
import type { BrowserContext } from "@playwright/test";

type TestSession = {
  hoominId: string;
  email: string;
  name: string | null;
  picture: string | null;
};

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(value: string) {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be at least 32 characters");
  }

  return toBase64Url(createHmac("sha256", secret).update(value).digest());
}

function encodeSession(session: TestSession) {
  const payload = toBase64Url(
    JSON.stringify({
      ...session,
      expiresAt: Date.now() + 1000 * 60 * 60,
    }),
  );

  return `${payload}.${sign(payload)}`;
}

export async function signInAsHoomin(
  context: BrowserContext,
  session: TestSession,
) {
  await context.addCookies([
    {
      name: "dear_hoomin_session",
      value: encodeSession(session),
      url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
