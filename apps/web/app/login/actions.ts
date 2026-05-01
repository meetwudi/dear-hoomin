"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createOAuthState,
  getAuthProvider,
} from "../../lib/auth/providers";
import { setOAuthState } from "../../lib/auth/session";

function getSafeNextPath(formData: FormData) {
  const nextPath = formData.get("next");

  if (typeof nextPath !== "string" || !nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

export async function signInWithGoogle(formData: FormData) {
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const state = createOAuthState();
  const nextPath = getSafeNextPath(formData);
  const googleProvider = getAuthProvider("google");
  const authorizationUrl = googleProvider.getAuthorizationUrl(origin, state);

  await setOAuthState(state, nextPath);
  redirect(authorizationUrl.toString());
}
