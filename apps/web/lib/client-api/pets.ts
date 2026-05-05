import { uploadAvatarReferencePhoto } from "../avatar-identities/store";
import type { AvatarSubjectType } from "../avatar-identities/types";
import {
  generateDailyThoughtImage,
  generateJournalThought,
  type JournalMusingGenerationProgress,
  generatePetAvatarCandidates,
  generateThoughtImageById,
} from "../pets/generation";
import {
  choosePetAvatar,
  createPetWithPhoto,
  deleteJournalThoughtForHoomin,
  updatePetProfile,
} from "../pets/store";
import { updateThoughtGenerationInstructions } from "../settings/store";
import { isAcceptedUploadImage } from "../uploads/images";
import { ApiRequestError, type ApiContext } from "./http";

export type UpdateFurbabyDetailsInput = {
  familyId: string;
  petId: string;
  name: string;
  instructions: string | null;
};

export type CreateJournalMusingInput = {
  familyId: string;
  journalText: string | null;
  petId: string;
  photos: File[];
};

export type JournalMusingEvent =
  | {
      familyId: string;
      petId: string;
      stage: "accepted" | "generating_text";
    }
  | {
      familyId: string;
      musingId: string;
      petId: string;
      stage: "musing_created" | "generating_image";
    }
  | {
      error?: string;
      familyId: string;
      musingId: string | null;
      petId: string;
      stage: "succeeded" | "failed" | "not_ready" | "in_progress";
    };

function requireAcceptedImage(file: File, error = "photo_type_invalid") {
  if (!isAcceptedUploadImage(file)) {
    throw new ApiRequestError(error);
  }

  return file;
}

function normalizeJournalMusingInput(input: CreateJournalMusingInput) {
  const photos = input.photos.slice(0, 6).map((photo) => requireAcceptedImage(photo));

  if (photos.length === 0) {
    throw new ApiRequestError("photos_required");
  }

  return {
    familyId: input.familyId,
    journalText: input.journalText?.trim().slice(0, 1000) || null,
    petId: input.petId,
    photos,
  };
}

function toJournalMusingEvent(
  input: Pick<CreateJournalMusingInput, "familyId" | "petId">,
  progress: JournalMusingGenerationProgress,
): JournalMusingEvent {
  if (progress.stage === "generating_text") {
    return {
      familyId: input.familyId,
      petId: input.petId,
      stage: progress.stage,
    };
  }

  return {
    familyId: input.familyId,
    musingId: progress.musingId,
    petId: input.petId,
    stage: progress.stage,
  };
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
  input: CreateJournalMusingInput,
) {
  const normalized = normalizeJournalMusingInput(input);
  const result = await generateJournalThought({
    familyId: normalized.familyId,
    petId: normalized.petId,
    hoominId: session.hoominId,
    journalText: normalized.journalText,
    photos: normalized.photos,
  });
  const musingId = "thoughtId" in result ? result.thoughtId : null;

  return {
    familyId: normalized.familyId,
    musingId,
    petId: normalized.petId,
    status: result.status,
  };
}

export async function* createJournalMusingEventsCapability(
  { session }: ApiContext,
  input: CreateJournalMusingInput,
): AsyncGenerator<JournalMusingEvent> {
  const normalized = normalizeJournalMusingInput(input);
  const pendingEvents: JournalMusingEvent[] = [
    {
      familyId: normalized.familyId,
      petId: normalized.petId,
      stage: "accepted",
    },
  ];
  let done = false;
  let wake: (() => void) | null = null;
  const pushEvent = (event: JournalMusingEvent) => {
    pendingEvents.push(event);
    wake?.();
    wake = null;
  };
  const operation = generateJournalThought({
    familyId: normalized.familyId,
    petId: normalized.petId,
    hoominId: session.hoominId,
    journalText: normalized.journalText,
    onProgress: (progress) => {
      pushEvent(toJournalMusingEvent(normalized, progress));
    },
    photos: normalized.photos,
  })
    .then((result) => {
      pushEvent({
        error: "error" in result ? result.error : undefined,
        familyId: normalized.familyId,
        musingId: "thoughtId" in result && result.thoughtId ? result.thoughtId : null,
        petId: normalized.petId,
        stage: result.status,
      });
    })
    .catch((error: unknown) => {
      pushEvent({
        error: error instanceof Error ? error.message : "journal_musing_failed",
        familyId: normalized.familyId,
        musingId: null,
        petId: normalized.petId,
        stage: "failed",
      });
    })
    .finally(() => {
      done = true;
      wake?.();
      wake = null;
    });

  while (!done || pendingEvents.length > 0) {
    const event = pendingEvents.shift();

    if (event) {
      yield event;
      continue;
    }

    await new Promise<void>((resolve) => {
      wake = resolve;
    });
  }

  await operation;
}

export async function deleteJournalMusingCapability(
  { session }: ApiContext,
  musingId: string,
) {
  await deleteJournalThoughtForHoomin({
    hoominId: session.hoominId,
    musingId,
  });

  return { musingId };
}
