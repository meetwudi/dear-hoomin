type StoredFile = {
  bucket: string;
  path: string;
  contentType: string;
};

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

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function uploadAppFile({
  path,
  contentType,
  bytes,
}: {
  path: string;
  contentType: string;
  bytes: Buffer;
}): Promise<StoredFile> {
  const { supabaseUrl, serviceRoleKey } = getStorageEnv();
  const bucket = "app-files";
  const uploadBytes = Uint8Array.from(bytes);
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encodeStoragePath(path)}`,
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

  return { bucket, path, contentType };
}

export async function downloadAppFile(path: string) {
  const { supabaseUrl, serviceRoleKey } = getStorageEnv();
  const bucket = "app-files";
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encodeStoragePath(path)}`,
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
}
