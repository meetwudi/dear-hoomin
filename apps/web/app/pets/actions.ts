"use server";

import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import { generateDailyThoughtImage } from "../../lib/pets/generation";
import { createPetWithPhoto } from "../../lib/pets/store";

async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key}_required`);
  }

  return value.trim();
}

function requirePhoto(formData: FormData) {
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("photo_required");
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
    throw new Error("photo_type_invalid");
  }

  return photo;
}

export async function createPetAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const name = requireString(formData, "name");
  const speciesValue = formData.get("species");
  const species =
    typeof speciesValue === "string" && speciesValue.trim()
      ? speciesValue.trim()
      : null;
  const photo = requirePhoto(formData);
  const petId = await createPetWithPhoto({
    familyId,
    hoominId: session.hoominId,
    name,
    species,
    photo,
  });

  await generateDailyThoughtImage(petId, session.hoominId);
  redirect(`/families/${familyId}`);
}

export async function generatePetImageAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const petId = requireString(formData, "petId");

  await generateDailyThoughtImage(petId, session.hoominId);
  redirect(`/families/${familyId}`);
}
