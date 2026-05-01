import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";
import type { AppStorage } from "./types";

function getStorageRoot() {
  const root = process.env.APP_LOCAL_STORAGE_DIR;

  if (!root) {
    throw new Error("Missing APP_LOCAL_STORAGE_DIR");
  }

  return root;
}

function resolveObjectPath(key: string) {
  const root = getStorageRoot();
  const resolved = normalize(join(root, key));

  if (!resolved.startsWith(normalize(root) + sep)) {
    throw new Error("object_key_invalid");
  }

  return resolved;
}

export const localStorageAdapter: AppStorage = {
  async uploadObject({ key, contentType, bytes }) {
    const objectPath = resolveObjectPath(key);

    await mkdir(dirname(objectPath), { recursive: true });
    await writeFile(objectPath, bytes);
    await writeFile(`${objectPath}.content-type`, contentType);

    return { key, contentType };
  },

  async downloadObject(key) {
    const objectPath = resolveObjectPath(key);

    try {
      const contentType = await readFile(`${objectPath}.content-type`, "utf8").catch(() =>
        contentTypeForKey(key),
      );

      return {
        bytes: await readFile(objectPath),
        contentType,
      };
    } catch {
      return null;
    }
  },
};

function contentTypeForKey(key: string) {
  if (key.endsWith(".svg")) {
    return "image/svg+xml";
  }

  if (key.endsWith(".webp")) {
    return "image/webp";
  }

  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "image/png";
}
