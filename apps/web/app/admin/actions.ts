"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import { requirePermission } from "../../lib/permissions";
import { upsertBaseAvatarStyleAsset } from "../../lib/pets/store";
import { uploadAppFile } from "../../lib/storage/supabase-storage";

function requireImage(formData: FormData) {
  const image = formData.get("baseAvatarStyle");

  if (!(image instanceof File) || image.size === 0) {
    throw new Error("base_avatar_style_required");
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
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
  const extension = image.type === "image/png" ? "png" : "jpg";
  const storagePath = `system/avatar-styles/base-${randomBytes(8).toString("hex")}.${extension}`;
  const storedFile = await uploadAppFile({
    path: storagePath,
    contentType: image.type,
    bytes: Buffer.from(await image.arrayBuffer()),
  });

  await upsertBaseAvatarStyleAsset({
    storagePath: storedFile.path,
    contentType: storedFile.contentType,
    hoominId: session.hoominId,
  });
  revalidatePath("/admin");
}
