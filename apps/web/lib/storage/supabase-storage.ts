// Platform note: update harness/platform-dependencies.md when storage changes.

import type { AppStorage } from "./types";

function getStorageEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    supabaseUrl,
    serviceRoleKey,
  };
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export const supabaseStorage: AppStorage = {
  async uploadObject({ key, contentType, bytes }) {
    const { supabaseUrl, serviceRoleKey } = getStorageEnv();
    const bucket = "app-files";
    const uploadBytes = Uint8Array.from(bytes);
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${encodeObjectKey(key)}`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          "cache-control": "3600",
          "content-type": contentType,
          "x-upsert": "true",
        },
        body: new Blob([uploadBytes], { type: contentType }),
      },
    );

    if (!response.ok) {
      throw new Error(`storage_upload_failed:${response.status}`);
    }

    return { key, contentType };
  },

  async downloadObject(key) {
    const { supabaseUrl, serviceRoleKey } = getStorageEnv();
    const bucket = "app-files";
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${encodeObjectKey(key)}`,
      {
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    return {
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      bytes: Buffer.from(await response.arrayBuffer()),
    };
  },
};
