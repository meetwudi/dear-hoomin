"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import { updatePetReferencePhoto } from "../../lib/pets/store";
import {
  updateHoominTimeZone,
  updateNotificationPreferences,
  updateThoughtGenerationInstructions,
} from "../../lib/settings/store";
import { isAcceptedUploadImage } from "../../lib/uploads/images";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key}_required`);
  }

  return value.trim();
}

function getSafeRedirectPath(formData: FormData, fallback = "/settings") {
  const value = formData.get("redirectTo");

  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
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

export async function updateTimeZoneAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/settings");
  }

  const timeZone = formData.get("timeZone");

  if (typeof timeZone !== "string") {
    throw new Error("time_zone_required");
  }

  await updateHoominTimeZone({
    hoominId: session.hoominId,
    timeZone,
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/settings");
  }

  await updateNotificationPreferences({
    hoominId: session.hoominId,
    allEnabled: formData.get("allEnabled") === "on",
    thoughtPublishedEnabled: formData.get("thoughtPublishedEnabled") === "on",
  });
  revalidatePath("/settings");
}

export async function updateThoughtGenerationInstructionsAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/settings");
  }

  const instructionsValue = formData.get("instructions");
  const instructions =
    typeof instructionsValue === "string" && instructionsValue.trim()
      ? instructionsValue.trim()
      : null;

  await updateThoughtGenerationInstructions({
    hoominId: session.hoominId,
    instructions,
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updatePetReferencePhotoAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/settings");
  }

  await updatePetReferencePhoto({
    familyId: requireString(formData, "familyId"),
    hoominId: session.hoominId,
    petId: requireString(formData, "petId"),
    photo: requirePhoto(formData),
  });
  const redirectTo = getSafeRedirectPath(formData);

  revalidatePath("/");
  revalidatePath("/settings");
  redirect(redirectTo);
}
