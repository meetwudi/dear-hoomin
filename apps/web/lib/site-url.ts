const localSiteOrigin = "http://localhost:3000";

function normalizeOrigin(origin: string) {
  return new URL(origin).origin;
}

export function getConfiguredSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL");
  }

  return localSiteOrigin;
}

export function buildSiteUrl(path: string) {
  return new URL(path, getConfiguredSiteOrigin()).toString();
}
