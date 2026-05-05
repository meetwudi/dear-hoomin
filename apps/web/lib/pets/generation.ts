import { randomBytes, randomUUID } from "node:crypto";
import {
  generateAvatarCandidateImage,
  generateDailyThoughtImageBytes,
} from "../ai/images";
import { generatePetThoughtText } from "../ai/thoughts";
import { generationLogger } from "../observability/logger";
import { sendMusingPublishedNotifications } from "../push/web-push";
import { getHoominSettings } from "../settings/store";
import { downloadAppObject, uploadAppObject } from "../storage";
import { normalizeUploadImage } from "../uploads/images";
import {
  attachGeneratedAvatarCandidate,
  attachGeneratedThoughtImage,
  createJournalThoughtWithPhotos,
  ensureDailyThoughtWithText,
  getBaseAvatarStyleAsset,
  getPetForAvatarGeneration,
  getPetForCronGeneration,
  getPetForGeneration,
  getThoughtForImageGeneration,
  listRecentThoughtTextsForPet,
  markAvatarGenerationFailed,
  markAvatarGenerationInProgress,
  markAvatarGenerationSucceeded,
  markThoughtGenerationFailed,
  markThoughtGenerationInProgress,
} from "./store";

// Platform note: update harness/platform-dependencies.md when generation providers change.

type GenerationPetRecord = {
  pet_id: string;
  family_id: string;
  pet_name: string;
  species: string | null;
  local_date: string;
  thought_id: string | null;
  thought_text: string | null;
  reference_photo_path: string | null;
  selected_avatar_path: string | null;
  hoomin_avatar_path?: string | null;
  extra_instructions?: string | null;
};

function isPlaceholderMusing(petName: string, musingText: string | null) {
  return (
    !musingText ||
    musingText === `${petName} is warming up a tiny musing.` ||
    musingText === `${petName} is warming up a tiny thought.` ||
    musingText === `today ${petName} has a little thought brewing.`
  );
}

export async function generatePetAvatarCandidates({
  petId,
  hoominId,
  instructions,
}: {
  petId: string;
  hoominId: string;
  instructions: string | null;
}) {
  const pet = await getPetForAvatarGeneration(petId, hoominId);

  if (!pet || !pet.reference_photo_path) {
    return { status: "not_ready" as const };
  }

  const log = generationLogger({
    familyId: pet.family_id,
    petId: pet.pet_id,
    generationType: "pet_avatar",
  });
  const didMarkInProgress = await markAvatarGenerationInProgress(pet.pet_id);

  if (!didMarkInProgress) {
    return { status: "in_progress" as const };
  }

  try {
    log.info("avatar_generation_started");
    const [referencePhoto, baseStyleAsset] = await Promise.all([
      downloadAppObject(pet.reference_photo_path),
      getBaseAvatarStyleAsset(),
    ]);

    if (!referencePhoto) {
      throw new Error("reference_photo_missing");
    }

    if (!baseStyleAsset) {
      throw new Error("base_avatar_style_missing");
    }

    const baseStyle = await downloadAppObject(baseStyleAsset.object_key);

    if (!baseStyle) {
      throw new Error("base_avatar_style_file_missing");
    }

    const generationGroupId = randomUUID();

    for (const variant of [1, 2, 3]) {
      const generated = await generateAvatarCandidateImage({
        petReference: {
          bytes: referencePhoto.bytes,
          contentType: referencePhoto.contentType,
        },
        baseStyle: {
          bytes: baseStyle.bytes,
          contentType: baseStyle.contentType,
        },
        petName: pet.pet_name,
        species: pet.species,
        instructions,
        variant,
        metadata: {
          familyId: pet.family_id,
          petId: pet.pet_id,
          requestedByHoominId: hoominId,
          generationType: "pet_avatar",
        },
      });
      const objectKey = `${pet.family_id}/pets/${pet.pet_id}/avatars/${generationGroupId}-${variant}-${randomBytes(6).toString("hex")}.png`;
      const storedObject = await uploadAppObject({
        key: objectKey,
        contentType: generated.contentType,
        bytes: generated.bytes,
      });

      await attachGeneratedAvatarCandidate({
        familyId: pet.family_id,
        petId: pet.pet_id,
        objectKey: storedObject.key,
        contentType: storedObject.contentType,
        generationGroupId,
        instructions,
        prompt: generated.prompt,
        hoominId,
      });
    }

    await markAvatarGenerationSucceeded(pet.pet_id);
    log.info({ generationGroupId }, "avatar_generation_succeeded");
    return { status: "succeeded" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "avatar_generation_failed";
    await markAvatarGenerationFailed(pet.pet_id, message);
    log.error({ error: message }, "avatar_generation_failed");
    return { status: "failed" as const, error: message };
  }
}

export async function generateDailyThoughtImage(
  petId: string,
  hoominId: string,
) {
  const pet = await getPetForGeneration(petId, hoominId);

  if (!pet) {
    return { status: "not_ready" as const };
  }

  return generateForPetRecord(pet, { requestedByHoominId: hoominId });
}

async function generateForPetRecord(
  pet: GenerationPetRecord,
  {
    requestedByHoominId = null,
  }: {
    requestedByHoominId?: string | null;
  } = {},
) {
  if (!pet.selected_avatar_path) {
    return { status: "avatar_required" as const };
  }

  let thoughtIdForFailure = pet.thought_id;
  const log = generationLogger({
    familyId: pet.family_id,
    petId: pet.pet_id,
    thoughtId: thoughtIdForFailure,
    generationType: "daily_thought_image",
  });

  try {
    let thoughtId = thoughtIdForFailure;
    let musingText = pet.thought_text;

    if (isPlaceholderMusing(pet.pet_name, musingText)) {
      log.info("thought_text_generation_started");
      const recentThoughts = await listRecentThoughtTextsForPet(
        pet.pet_id,
        pet.local_date,
      );
      musingText = await generatePetThoughtText({
        petName: pet.pet_name,
        species: pet.species,
        recentThoughts,
        extraInstructions: pet.extra_instructions ?? null,
        metadata: {
          familyId: pet.family_id,
          petId: pet.pet_id,
          requestedByHoominId,
          generationType: "daily_thought_text",
        },
      });
      thoughtId = await ensureDailyThoughtWithText({
        petId: pet.pet_id,
        petName: pet.pet_name,
        localDate: pet.local_date,
        thoughtText: musingText,
      });
      thoughtIdForFailure = thoughtId;
    }

    if (!thoughtId || !musingText) {
      return { status: "not_ready" as const };
    }

    const didMarkInProgress = await markThoughtGenerationInProgress(thoughtId);

    if (!didMarkInProgress) {
      return { status: "in_progress" as const };
    }

    log.info({ thoughtId }, "thought_image_generation_started");
    const [avatar, hoominAvatar] = await Promise.all([
      downloadAppObject(pet.selected_avatar_path),
      pet.hoomin_avatar_path
        ? downloadAppObject(pet.hoomin_avatar_path)
        : Promise.resolve(null),
    ]);

    if (!avatar) {
      throw new Error("selected_avatar_missing");
    }

    const generated = await generateDailyThoughtImageBytes({
      avatar: {
        bytes: avatar.bytes,
        contentType: avatar.contentType,
      },
      hoominAvatar: hoominAvatar
        ? {
            bytes: hoominAvatar.bytes,
            contentType: hoominAvatar.contentType,
          }
        : undefined,
      petName: pet.pet_name,
      species: pet.species,
      thoughtText: musingText,
      metadata: {
        familyId: pet.family_id,
        petId: pet.pet_id,
        thoughtId,
        requestedByHoominId,
        generationType: "daily_thought_image",
      },
    });
    const objectKey = `${pet.family_id}/thoughts/${thoughtId}/generated-${randomBytes(8).toString("hex")}.png`;
    const storedObject = await uploadAppObject({
      key: objectKey,
      contentType: generated.contentType,
      bytes: generated.bytes,
    });

    await attachGeneratedThoughtImage({
      familyId: pet.family_id,
      thoughtId,
      objectKey: storedObject.key,
      contentType: storedObject.contentType,
      prompt: generated.prompt,
    });

    await sendMusingPublishedNotifications({
      familyId: pet.family_id,
      petName: pet.pet_name,
      musingText,
    });

    log.info({ thoughtId }, "thought_image_generation_succeeded");
    return { status: "succeeded" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "image_generation_failed";

    if (thoughtIdForFailure) {
      await markThoughtGenerationFailed(thoughtIdForFailure, message);
    }

    log.error({ error: message }, "thought_image_generation_failed");
    return { status: "failed" as const };
  }
}

export async function generateDailyThoughtImageForCron(
  petId: string,
  localDate: string,
) {
  const pet = await getPetForCronGeneration(petId, localDate);

  if (!pet || !pet.selected_avatar_path) {
    return { status: "not_ready" as const };
  }

  return generateForPetRecord(pet);
}

export async function generateThoughtImageById(
  thoughtId: string,
  hoominId: string,
) {
  const thought = await getThoughtForImageGeneration(thoughtId, hoominId);

  if (!thought || !thought.selected_avatar_path) {
    return { status: "not_ready" as const };
  }

  if (thought.source === "journal" && !thought.journal_photo_path) {
    return { status: "not_ready" as const };
  }

  const didMarkInProgress = await markThoughtGenerationInProgress(thought.thought_id);

  if (!didMarkInProgress) {
    return { status: "in_progress" as const };
  }

  const log = generationLogger({
    familyId: thought.family_id,
    petId: thought.pet_id,
    thoughtId: thought.thought_id,
    generationType:
      thought.source === "journal"
        ? "journal_thought_image"
        : "daily_thought_image",
  });

  try {
    log.info("thought_image_regeneration_started");
    const [avatar, hoominAvatar, journalPhoto] = await Promise.all([
      downloadAppObject(thought.selected_avatar_path),
      thought.hoomin_avatar_path
        ? downloadAppObject(thought.hoomin_avatar_path)
        : Promise.resolve(null),
      thought.journal_photo_path
        ? downloadAppObject(thought.journal_photo_path)
        : Promise.resolve(null),
    ]);

    if (!avatar) {
      throw new Error("selected_avatar_missing");
    }

    if (thought.source === "journal" && !journalPhoto) {
      throw new Error("journal_photo_missing");
    }

    const generated = await generateDailyThoughtImageBytes({
      avatar: {
        bytes: avatar.bytes,
        contentType: avatar.contentType,
      },
      hoominAvatar: hoominAvatar
        ? {
            bytes: hoominAvatar.bytes,
            contentType: hoominAvatar.contentType,
          }
        : undefined,
      journalPhoto: journalPhoto
        ? {
            bytes: journalPhoto.bytes,
            contentType: journalPhoto.contentType,
          }
        : undefined,
      petName: thought.pet_name,
      species: thought.species,
      thoughtText: thought.thought_text,
      journalText: thought.journal_text ?? undefined,
      metadata: {
        familyId: thought.family_id,
        petId: thought.pet_id,
        thoughtId: thought.thought_id,
        requestedByHoominId: hoominId,
        generationType:
          thought.source === "journal"
            ? "journal_thought_image"
            : "daily_thought_image",
      },
    });
    const objectKey = `${thought.family_id}/thoughts/${thought.thought_id}/generated-${randomBytes(8).toString("hex")}.png`;
    const storedObject = await uploadAppObject({
      key: objectKey,
      contentType: generated.contentType,
      bytes: generated.bytes,
    });

    await attachGeneratedThoughtImage({
      familyId: thought.family_id,
      thoughtId: thought.thought_id,
      objectKey: storedObject.key,
      contentType: storedObject.contentType,
      prompt: generated.prompt,
    });

    if (!thought.image_file_id) {
      await sendMusingPublishedNotifications({
        familyId: thought.family_id,
        petName: thought.pet_name,
        musingText: thought.thought_text,
      });
    }

    log.info("thought_image_regeneration_succeeded");
    return { status: "succeeded" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "image_generation_failed";

    await markThoughtGenerationFailed(thought.thought_id, message);
    log.error({ error: message }, "thought_image_regeneration_failed");
    return { status: "failed" as const };
  }
}

export async function generateJournalThought({
  familyId,
  petId,
  hoominId,
  journalText,
  photos,
}: {
  familyId: string;
  petId: string;
  hoominId: string;
  journalText: string;
  photos: File[];
}) {
  const pet = await getPetForGeneration(petId, hoominId);

  if (!pet || pet.family_id !== familyId || !pet.selected_avatar_path) {
    return { status: "not_ready" as const };
  }

  const log = generationLogger({
    familyId: pet.family_id,
    petId: pet.pet_id,
    generationType: "journal_thought",
  });

  let thoughtId: string | null = null;

  try {
    const [settings, recentThoughts] = await Promise.all([
      getHoominSettings(hoominId),
      listRecentThoughtTextsForPet(pet.pet_id, pet.local_date),
    ]);
    const firstPhoto = photos[0];
    const normalizedFirstPhoto = await normalizeUploadImage(firstPhoto);

    log.info("journal_thought_text_generation_started");
    const musingText = await generatePetThoughtText({
      petName: pet.pet_name,
      species: pet.species,
      journalText,
      referenceImage: {
        bytes: normalizedFirstPhoto.bytes,
        contentType: normalizedFirstPhoto.contentType,
      },
      recentThoughts,
      extraInstructions: settings.thoughtGenerationInstructions,
      metadata: {
        familyId: pet.family_id,
        petId: pet.pet_id,
        requestedByHoominId: hoominId,
        generationType: "journal_thought_text",
      },
    });

    const created = await createJournalThoughtWithPhotos({
      familyId: pet.family_id,
      petId: pet.pet_id,
      hoominId,
      localDate: pet.local_date,
      thoughtText: musingText,
      journalText,
      photos,
    });
    thoughtId = created.thoughtId;

    const didMarkInProgress = await markThoughtGenerationInProgress(thoughtId);

    if (!didMarkInProgress) {
      return { status: "in_progress" as const };
    }

    const [avatar, hoominAvatar] = await Promise.all([
      downloadAppObject(pet.selected_avatar_path),
      pet.hoomin_avatar_path
        ? downloadAppObject(pet.hoomin_avatar_path)
        : Promise.resolve(null),
    ]);

    if (!avatar) {
      throw new Error("selected_avatar_missing");
    }

    log.info({ thoughtId }, "journal_thought_image_generation_started");
    const generated = await generateDailyThoughtImageBytes({
      avatar: {
        bytes: avatar.bytes,
        contentType: avatar.contentType,
      },
      hoominAvatar: hoominAvatar
        ? {
            bytes: hoominAvatar.bytes,
            contentType: hoominAvatar.contentType,
          }
        : undefined,
      journalPhoto: {
        bytes: normalizedFirstPhoto.bytes,
        contentType: normalizedFirstPhoto.contentType,
      },
      petName: pet.pet_name,
      species: pet.species,
      thoughtText: musingText,
      journalText,
      metadata: {
        familyId: pet.family_id,
        petId: pet.pet_id,
        thoughtId,
        requestedByHoominId: hoominId,
        generationType: "journal_thought_image",
      },
    });
    const objectKey = `${pet.family_id}/thoughts/${thoughtId}/generated-${randomBytes(8).toString("hex")}.png`;
    const storedObject = await uploadAppObject({
      key: objectKey,
      contentType: generated.contentType,
      bytes: generated.bytes,
    });

    await attachGeneratedThoughtImage({
      familyId: pet.family_id,
      thoughtId,
      objectKey: storedObject.key,
      contentType: storedObject.contentType,
      prompt: generated.prompt,
    });

    await sendMusingPublishedNotifications({
      familyId: pet.family_id,
      petName: pet.pet_name,
      musingText,
    });

    log.info({ thoughtId }, "journal_thought_generation_succeeded");
    return { status: "succeeded" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "journal_generation_failed";

    if (thoughtId) {
      await markThoughtGenerationFailed(thoughtId, message);
    }

    log.error({ error: message }, "journal_thought_generation_failed");
    return { status: "failed" as const };
  }
}
