import { headers } from "next/headers";
import { getConfiguredSiteOrigin } from "../site-url";

export async function getRequestOrigin() {
  const requestHeaders = await headers();
  return requestHeaders.get("origin") ?? getConfiguredSiteOrigin();
}
