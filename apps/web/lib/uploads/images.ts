import convertHeic from "heic-convert";
import sharp from "sharp";
import { imageUploadAccept } from "./constants";

const acceptedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const imageTypeByExtension = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["heic", "image/heic"],
  ["heif", "image/heif"],
]);

export { imageUploadAccept };

export type NormalizedUploadImage = {
  bytes: Buffer;
  contentType: string;
  extension: "jpg" | "png" | "webp";
};

function extensionForFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return extension ? imageTypeByExtension.get(extension) : null;
}

export function isAcceptedUploadImage(file: File) {
  const contentType = file.type || extensionForFile(file);

  return Boolean(contentType && acceptedImageTypes.has(contentType));
}

function isHeicUpload(file: File) {
  const contentType = file.type || extensionForFile(file);

  return contentType === "image/heic" || contentType === "image/heif";
}

async function normalizeToJpeg(bytes: Buffer) {
  return sharp(bytes)
    .rotate()
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function normalizeUploadImage(file: File): Promise<NormalizedUploadImage> {
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isHeicUpload(file)) {
    try {
      const jpegBytes = Buffer.from(
        await convertHeic({
          buffer: bytes,
          format: "JPEG",
          quality: 0.92,
        }),
      );

      return {
        bytes: await normalizeToJpeg(jpegBytes),
        contentType: "image/jpeg",
        extension: "jpg",
      };
    } catch {
      throw new Error("heic_conversion_failed");
    }
  }

  return {
    bytes: await normalizeToJpeg(bytes),
    contentType: "image/jpeg",
    extension: "jpg",
  };
}
