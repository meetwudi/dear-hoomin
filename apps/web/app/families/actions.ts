"use server";

import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import {
  acceptFamilyInvite,
  createFamily,
  createFamilyInvite,
  removeFamilyMember,
} from "../../lib/families/store";
import { updatePetProfile } from "../../lib/pets/store";
import { updateThoughtGenerationInstructions } from "../../lib/settings/store";

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
  const familyId = await createFamily(familyName, session.hoominId);

  redirect(`/families/${familyId}`);
}

export async function createFamilyInviteAction(formData: FormData) {
  const session = await requireSession();
  const familyId = formData.get("familyId");

  if (typeof familyId !== "string" || !familyId) {
    throw new Error("family_id_required");
  }

  await createFamilyInvite(familyId, session.hoominId);
  redirect(`/families/${familyId}`);
}

export async function acceptFamilyInviteAction(formData: FormData) {
  const session = await requireSession();
  const inviteToken = formData.get("inviteToken");

  if (typeof inviteToken !== "string" || !inviteToken) {
    throw new Error("invite_token_required");
  }

  const familyId = await acceptFamilyInvite(inviteToken, session.hoominId);
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

export async function updateFurbabyProfileAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const petId = requireString(formData, "petId");
  const name = requireString(formData, "name").slice(0, 80);

  await updatePetProfile({
    familyId,
    hoominId: session.hoominId,
    name,
    petId,
  });
  redirect(getFamilyRedirectPath(familyId, petId));
}

export async function updateFamilyFurbabyNotesAction(formData: FormData) {
  const session = await requireSession();
  const familyId = requireString(formData, "familyId");
  const petIdValue = formData.get("petId");
  const petId =
    typeof petIdValue === "string" && petIdValue.trim()
      ? petIdValue.trim()
      : undefined;
  const instructionsValue = formData.get("instructions");
  const instructions =
    typeof instructionsValue === "string" && instructionsValue.trim()
      ? instructionsValue.trim()
      : null;

  await updateThoughtGenerationInstructions({
    hoominId: session.hoominId,
    instructions,
  });
  redirect(getFamilyRedirectPath(familyId, petId));
}
