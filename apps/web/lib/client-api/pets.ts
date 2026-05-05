import { uploadAvatarReferencePhoto } from "../avatar-identities/store";
import type { AvatarSubjectType } from "../avatar-identities/types";
import {
  generateDailyThoughtImage,
  generateJournalThought,
  generatePetAvatarCandidates,
  generateThoughtImageById,
} from "../pets/generation";
import { choosePetAvatar, createPetWithPhoto, updatePetProfile } from "../pets/store";
import { updateThoughtGenerationInstructions } from "../settings/store";
import { isAcceptedUploadImage } from "../uploads/images";
import { ApiRequestError, type ApiContext } from "./http";

export type UpdateFurbabyDetailsInput = {
  familyId: string;
  petId: string;
  name: string;
  instructions: string | null;
};

function requireAcceptedImage(file: File, error = "photo_type_invalid") {
  if (!isAcceptedUploadImage(file)) {
    throw new ApiRequestError(error);
  }

  return file;
}

export async function createPetCapability(
  { session }: ApiContext,
  input: {
    familyId: string;
    name: string;
    photo: File;
  },
) {
  const petId = await createPetWithPhoto({
    familyId: input.familyId,
    hoominId: session.hoominId,
    name: input.name.trim(),
    species: null,
    photo: requireAcceptedImage(input.photo),
  });

  await generatePetAvatarCandidates({
    petId,
    hoominId: session.hoominId,
    instructions: null,
  });

  return { petId };
}

export async function updateFurbabyDetailsCapability(
  { session }: ApiContext,
  input: UpdateFurbabyDetailsInput,
) {
  const name = input.name.trim().slice(0, 80);

  if (!name) {
    throw new ApiRequestError("name_required");
  }

  await updatePetProfile({
    familyId: input.familyId,
    hoominId: session.hoominId,
    name,
    petId: input.petId,
  });
  const settings = await updateThoughtGenerationInstructions({
    hoominId: session.hoominId,
    instructions: input.instructions,
  });

  return {
    petId: input.petId,
    settings,
  };
}

export async function uploadAvatarReferencePhotoCapability(
  { session }: ApiContext,
  input: {
    familyId: string;
    subjectType: AvatarSubjectType;
    subjectId: string;
    displayName: string;
    photo: File;
  },
) {
  return {
    avatarIdentityId: await uploadAvatarReferencePhoto({
      familyId: input.familyId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      displayName: input.displayName.trim().slice(0, 120),
      hoominId: session.hoominId,
      photo: requireAcceptedImage(input.photo),
    }),
  };
}

export async function generatePetAvatarCandidatesCapability(
  { session }: ApiContext,
  input: {
    petId: string;
    instructions: string | null;
  },
) {
  await generatePetAvatarCandidates({
    petId: input.petId,
    hoominId: session.hoominId,
    instructions: input.instructions,
  });

  return { petId: input.petId };
}

export async function choosePetAvatarCapability(
  { session }: ApiContext,
  input: {
    petId: string;
    candidateId: string;
  },
) {
  await choosePetAvatar({
    petId: input.petId,
    candidateId: input.candidateId,
    hoominId: session.hoominId,
  });

  return {
    petId: input.petId,
    candidateId: input.candidateId,
  };
}

export async function generateDailyMusingImageCapability(
  { session }: ApiContext,
  petId: string,
) {
  await generateDailyThoughtImage(petId, session.hoominId);

  return { petId };
}

export async function generateThoughtImageCapability(
  { session }: ApiContext,
  thoughtId: string,
) {
  await generateThoughtImageById(thoughtId, session.hoominId);

  return { thoughtId };
}

export async function createJournalMusingCapability(
  { session }: ApiContext,
  input: {
    familyId: string;
    petId: string;
    journalText: string;
    photos: File[];
  },
) {
  const photos = input.photos.map((photo) => requireAcceptedImage(photo)).slice(0, 6);

  if (photos.length === 0) {
    throw new ApiRequestError("photos_required");
  }

  await generateJournalThought({
    familyId: input.familyId,
    petId: input.petId,
    hoominId: session.hoominId,
    journalText: input.journalText.trim().slice(0, 1000),
    photos,
  });

  return {
    familyId: input.familyId,
    petId: input.petId,
  };
}
