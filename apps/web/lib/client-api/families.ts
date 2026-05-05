import {
  acceptFamilyInvite,
  createFamily,
  createFamilyInvite,
  getFamilyForHoomin,
  listFamiliesForHoomin,
  listFamilyInvites,
  listFamilyMembers,
} from "../families/store";
import { listPetsForFamily } from "../pets/store";
import type { ApiContext } from "./http";

export type CreateFamilyInput = {
  name: string;
};

function normalizeFamilyName(name: string) {
  const trimmed = name.trim();

  if (!trimmed || trimmed.length > 100) {
    throw new Error("family_name_invalid");
  }

  return trimmed;
}

export async function listFamiliesCapability({ session }: ApiContext) {
  return {
    families: await listFamiliesForHoomin(session.hoominId),
  };
}

export async function createFamilyCapability(
  { session }: ApiContext,
  input: CreateFamilyInput,
) {
  const familyId = await createFamily(
    normalizeFamilyName(input.name),
    session.hoominId,
  );

  return { familyId };
}

export async function getFamilyCapability(
  { session }: ApiContext,
  familyId: string,
) {
  const [family, members, invites, pets] = await Promise.all([
    getFamilyForHoomin(familyId, session.hoominId),
    listFamilyMembers(familyId, session.hoominId),
    listFamilyInvites(familyId, session.hoominId),
    listPetsForFamily(familyId, session.hoominId),
  ]);

  if (!family) {
    throw new Error("family_not_found");
  }

  return {
    family,
    members,
    invites,
    pets,
  };
}

export async function createFamilyInviteCapability(
  { session }: ApiContext,
  familyId: string,
) {
  return {
    invite: await createFamilyInvite(familyId, session.hoominId),
  };
}

export async function acceptFamilyInviteCapability(
  { session }: ApiContext,
  inviteToken: string,
) {
  return {
    familyId: await acceptFamilyInvite(inviteToken, session.hoominId),
  };
}
