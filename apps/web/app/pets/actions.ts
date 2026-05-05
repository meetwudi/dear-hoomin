"use server";

import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import {
  choosePetAvatarCapability,
  createJournalMusingCapability,
  createPetCapability,
  generateDailyMusingImageCapability,
  generatePetAvatarCandidatesCapability,
  generateThoughtImageCapability,
} from "../../lib/client-api/pets";
import { isAcceptedUploadImage } from "../../lib/uploads/images";

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

function getSafeRedirectPath(formData: FormData) {
  const value = formData.get("redirectTo");

  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function requirePhoto(formData: FormData) {
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("photo_required");
  }

  if (!isAcceptedUploadImage(photo)) {
    throw new Error("photo_type_invalid");
  }

  return photo;
}

function requireJournalPhotos(formData: FormData) {
  const photos = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (photos.length === 0) {
    throw new Error("photos_required");
  }

  for (const photo of photos) {
    if (!isAcceptedUploadImage(photo)) {
      throw new Error("photo_type_invalid");
    }
  }

  return photos.slice(0, 6);
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

export async function createPetAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const name = requireString(formData, "name");
  const photo = requirePhoto(formData);
  await createPetCapability({ session }, {
    familyId,
    name,
    photo,
  });
  redirect(getSafeRedirectPath(formData));
}

export async function generatePetImageAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const petId = requireString(formData, "petId");

  await generateDailyMusingImageCapability({ session }, petId);
  redirect("/");
}

export async function generateThoughtImageAction(formData: FormData) {
  const session = await requireSession();
  const thoughtId = requireString(formData, "thoughtId");

  await generateThoughtImageCapability({ session }, thoughtId);
  redirect("/");
}

export async function createJournalThoughtAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const petId = requireString(formData, "petId");
  const journalText = optionalString(formData, "journalText");
  const photos = requireJournalPhotos(formData);

  await createJournalMusingCapability({ session }, {
    familyId,
    petId,
    journalText,
    photos,
  });
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

  await generatePetAvatarCandidatesCapability({ session }, {
    petId,
    instructions,
  });
  redirect(getSafeRedirectPath(formData));
}

export async function choosePetAvatarAction(formData: FormData) {
  const session = await requireSession();
  const petId = requireString(formData, "petId");
  const candidateId = requireString(formData, "candidateId");

  await choosePetAvatarCapability({ session }, {
    petId,
    candidateId,
  });
  redirect(getSafeRedirectPath(formData));
}
