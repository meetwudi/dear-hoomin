"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createOAuthState,
  getGoogleAuthorizationUrl,
} from "../../lib/auth/google";
import { setOAuthState } from "../../lib/auth/session";

export async function signInWithGoogle() {
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const state = createOAuthState();
  const authorizationUrl = getGoogleAuthorizationUrl(origin, state);

  await setOAuthState(state);
  redirect(authorizationUrl.toString());
}
