"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import {
  acceptFamilyInviteCapability,
  createFamilyCapability,
  createFamilyInviteCapability,
} from "../../lib/client-api/families";
import {
  updateFurbabyDetailsCapability,
  uploadAvatarReferencePhotoCapability,
} from "../../lib/client-api/pets";
import {
  updateNotificationPreferencesCapability,
  updateSettingsCapability,
} from "../../lib/client-api/settings";
import { removeFamilyMember } from "../../lib/families/store";
import { isAcceptedUploadImage } from "../../lib/uploads/images";

function requireFamilyName(formData: FormData) {
  const name = formData.get("name");

  if (typeof name !== "string") {
    throw new Error("family_name_required");
  }

  const trimmedName = name.trim();

  if (!trimmedName || trimmedName.length > 100) {
    throw new Error("family_name_invalid");
  }

  return trimmedName;
}

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key}_required`);
  }

  return value.trim();
}

function getFamilyRedirectPath(familyId: string, petId?: string) {
  return petId
    ? `/families/${familyId}?petId=${petId}`
    : `/families/${familyId}`;
}

function getSafeRedirectPath(formData: FormData, fallback: string) {
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

async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function createFamilyAction(formData: FormData) {
  const session = await requireSession();
  const familyName = requireFamilyName(formData);
  const { familyId } = await createFamilyCapability(
    { session },
    { name: familyName },
  );

  redirect(`/families/${familyId}`);
}

export async function createFamilyInviteAction(formData: FormData) {
  const session = await requireSession();
  const familyId = formData.get("familyId");

  if (typeof familyId !== "string" || !familyId) {
    throw new Error("family_id_required");
  }

  await createFamilyInviteCapability({ session }, familyId);
  redirect(`/families/${familyId}`);
}

export async function acceptFamilyInviteAction(formData: FormData) {
  const session = await requireSession();
  const inviteToken = formData.get("inviteToken");

  if (typeof inviteToken !== "string" || !inviteToken) {
    throw new Error("invite_token_required");
  }

  const { familyId } = await acceptFamilyInviteCapability(
    { session },
    inviteToken,
  );
  redirect(`/families/${familyId}`);
}

export async function removeFamilyMemberAction(formData: FormData) {
  const session = await requireSession();
  const familyId = formData.get("familyId");
  const targetHoominId = formData.get("targetHoominId");

  if (typeof familyId !== "string" || !familyId) {
    throw new Error("family_id_required");
  }

  if (typeof targetHoominId !== "string" || !targetHoominId) {
    throw new Error("target_hoomin_id_required");
  }

  await removeFamilyMember(familyId, session.hoominId, targetHoominId);
  redirect(`/families/${familyId}`);
}

export async function updateFamilyFurbabyDetailsAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const petId = requireString(formData, "petId");
  const name = requireString(formData, "name").slice(0, 80);
  const instructionsValue = formData.get("instructions");
  const instructions =
    typeof instructionsValue === "string" && instructionsValue.trim()
      ? instructionsValue.trim()
      : null;

  await updateFurbabyDetailsCapability({ session }, {
    familyId,
    name,
    petId,
    instructions,
  });

  redirect(getFamilyRedirectPath(familyId, petId));
}

export async function updateFamilyAvatarPhotoAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const subjectType = requireString(formData, "subjectType");
  const subjectId = requireString(formData, "subjectId");
  const displayName = requireString(formData, "displayName").slice(0, 120);

  if (subjectType !== "pet" && subjectType !== "hoomin") {
    throw new Error("subject_type_invalid");
  }

  await uploadAvatarReferencePhotoCapability({ session }, {
    familyId,
    subjectType,
    subjectId,
    displayName,
    photo: requirePhoto(formData),
  });

  redirect(getSafeRedirectPath(formData, getFamilyRedirectPath(familyId)));
}

export async function updateFamilyTimeZoneAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const timeZone = formData.get("timeZone");

  if (typeof timeZone !== "string") {
    throw new Error("time_zone_required");
  }

  await updateSettingsCapability({ session }, {
    timeZone,
  });

  const redirectTo = getSafeRedirectPath(formData, getFamilyRedirectPath(familyId));

  revalidatePath("/");
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function updateFamilyNotificationPreferencesAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");

  await updateNotificationPreferencesCapability({ session }, {
    allEnabled: formData.get("allEnabled") === "on",
    thoughtPublishedEnabled: formData.get("thoughtPublishedEnabled") === "on",
  });

  const redirectTo = getSafeRedirectPath(formData, getFamilyRedirectPath(familyId));

  revalidatePath(redirectTo);
  redirect(redirectTo);
}
