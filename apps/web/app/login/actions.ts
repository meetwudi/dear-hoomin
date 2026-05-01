"use server";

import { redirect } from "next/navigation";
import {
  createOAuthState,
  getAuthProvider,
} from "../../lib/auth/providers";
import { setOAuthState } from "../../lib/auth/session";
import { getRequestOrigin } from "../../lib/http/origin";

function getSafeNextPath(formData: FormData) {
  const nextPath = formData.get("next");

  if (typeof nextPath !== "string" || !nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

export async function signInWithGoogle(formData: FormData) {
  const origin = await getRequestOrigin();
  const state = createOAuthState();
  const nextPath = getSafeNextPath(formData);
  const googleProvider = getAuthProvider("google");
  const authorizationUrl = googleProvider.getAuthorizationUrl(origin, state);

  await setOAuthState(state, nextPath);
  redirect(authorizationUrl.toString());
}
