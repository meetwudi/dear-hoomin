"use server";

import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import {
  generateDailyThoughtImage,
  generatePetAvatarCandidates,
} from "../../lib/pets/generation";
import { choosePetAvatar, createPetWithPhoto } from "../../lib/pets/store";

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

  await generatePetAvatarCandidates({
    petId,
    hoominId: session.hoominId,
    instructions: null,
  });
  redirect("/");
}

export async function generatePetImageAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const petId = requireString(formData, "petId");

  await generateDailyThoughtImage(petId, session.hoominId);
  redirect("/");
}

export async function generatePetAvatarsAction(formData: FormData) {
  const session = await requireSession();
  const petId = requireString(formData, "petId");
  const instructionsValue = formData.get("instructions");
  const instructions =
    typeof instructionsValue === "string" && instructionsValue.trim()
      ? instructionsValue.trim()
      : null;

  await generatePetAvatarCandidates({
    petId,
    hoominId: session.hoominId,
    instructions,
  });
  redirect("/");
}

export async function choosePetAvatarAction(formData: FormData) {
  const session = await requireSession();
  const petId = requireString(formData, "petId");
  const candidateId = requireString(formData, "candidateId");

  await choosePetAvatar({
    petId,
    candidateId,
    hoominId: session.hoominId,
  });
  redirect("/");
}
