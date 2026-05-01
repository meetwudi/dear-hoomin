"use server";

import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import {
  acceptFamilyInvite,
  createFamily,
  createFamilyInvite,
  removeFamilyMember,
} from "../../lib/families/store";

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
