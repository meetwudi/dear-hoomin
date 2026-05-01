import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForGoogleUser } from "../../../../lib/auth/google";
import {
  consumeOAuthState,
  setSession,
} from "../../../../lib/auth/session";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing-auth-code", requestUrl.origin),
    );
  }

  const expectedState = await consumeOAuthState();

  if (!expectedState) {
    return NextResponse.redirect(
      new URL("/login?error=missing-oauth-state", requestUrl.origin),
    );
  }

  if (!state || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-oauth-state", requestUrl.origin),
    );
  }

  try {
    const googleUser = await exchangeCodeForGoogleUser(code, requestUrl.origin);

    await setSession({
      googleSub: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name ?? null,
      picture: googleUser.picture ?? null,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=google-token-exchange-failed", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
