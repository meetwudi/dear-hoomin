import { NextResponse, type NextRequest } from "next/server";
import { findOrCreateHoominForProviderProfile } from "../../../../lib/auth/accounts";
import { getAuthProvider } from "../../../../lib/auth/providers";
import {
  consumeOAuthState,
  setSession,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

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
    const googleProvider = getAuthProvider("google");
    const profile = await googleProvider.exchangeCodeForProfile(
      code,
      requestUrl.origin,
    );
    const hoomin = await findOrCreateHoominForProviderProfile(profile);

    await setSession({
      hoominId: hoomin.hoominId,
      email: hoomin.email,
      name: hoomin.displayName,
      picture: hoomin.avatarUrl,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=google-token-exchange-failed", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
