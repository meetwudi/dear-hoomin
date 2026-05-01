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

function uploadExtension(file: File): NormalizedUploadImage["extension"] {
  if (file.type === "image/png" || extensionForFile(file) === "image/png") {
    return "png";
  }

  if (file.type === "image/webp" || extensionForFile(file) === "image/webp") {
    return "webp";
  }

  return "jpg";
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
        bytes: await sharp(jpegBytes).rotate().jpeg({ quality: 92 }).toBuffer(),
        contentType: "image/jpeg",
        extension: "jpg",
      };
    } catch {
      throw new Error("heic_conversion_failed");
    }
  }

  const extension = uploadExtension(file);

  return {
    bytes,
    contentType:
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg",
    extension,
  };
}
