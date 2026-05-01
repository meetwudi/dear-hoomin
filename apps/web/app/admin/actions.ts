"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import { requirePermission } from "../../lib/permissions";
import { runDailyGeneration } from "../../lib/pets/daily-generation";
import { upsertBaseAvatarStyleAsset } from "../../lib/pets/store";
import { uploadAppObject } from "../../lib/storage";
import { isAcceptedUploadImage, normalizeUploadImage } from "../../lib/uploads/images";

function requireImage(formData: FormData) {
  const image = formData.get("baseAvatarStyle");

  if (!(image instanceof File) || image.size === 0) {
    throw new Error("base_avatar_style_required");
  }

  if (!isAcceptedUploadImage(image)) {
    throw new Error("base_avatar_style_type_invalid");
  }

  return image;
}

export async function uploadBaseAvatarStyleAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/admin");
  }

  requirePermission("avatar-style:manage", { session });

  const image = requireImage(formData);
  const normalized = await normalizeUploadImage(image);
  const extension = normalized.extension;
  const objectKey = `system/avatar-styles/base-${randomBytes(8).toString("hex")}.${extension}`;
  const storedObject = await uploadAppObject({
    key: objectKey,
    contentType: normalized.contentType,
    bytes: normalized.bytes,
  });

  await upsertBaseAvatarStyleAsset({
    objectKey: storedObject.key,
    contentType: storedObject.contentType,
    hoominId: session.hoominId,
  });
  revalidatePath("/admin");
}

export async function triggerDailyGenerationAction() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/admin");
  }

  requirePermission("cron:trigger", { session });

  const result = await runDailyGeneration({ mode: "current_local_date" });
  revalidatePath("/");
  revalidatePath("/admin");

  return result;
}
