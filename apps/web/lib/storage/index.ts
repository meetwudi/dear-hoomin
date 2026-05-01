import { localStorageAdapter } from "./local-storage";
import { supabaseStorage } from "./supabase-storage";

function getStorage() {
  if (process.env.APP_STORAGE_ADAPTER === "local") {
    return localStorageAdapter;
  }

  return supabaseStorage;
}

export async function uploadAppObject(input: {
  key: string;
  contentType: string;
  bytes: Buffer;
}) {
  return getStorage().uploadObject(input);
}

export async function downloadAppObject(key: string) {
  return getStorage().downloadObject(key);
}
