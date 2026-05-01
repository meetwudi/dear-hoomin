import { randomBytes, randomUUID } from "node:crypto";
import {
  generateAvatarCandidateImage,
  generateDailyThoughtImageBytes,
} from "../ai/images";
import { generatePetThoughtText } from "../ai/thoughts";
import { generationLogger } from "../observability/logger";
import { sendThoughtPublishedNotifications } from "../push/web-push";
import { downloadAppFile, uploadAppFile } from "../storage/supabase-storage";
import {
  attachGeneratedAvatarCandidate,
  attachGeneratedThoughtImage,
  ensureDailyThoughtWithText,
  getBaseAvatarStyleAsset,
  getPetForAvatarGeneration,
  getPetForCronGeneration,
  getPetForGeneration,
  getTodayIsoDate,
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
  thought_id: string | null;
  thought_text: string | null;
  reference_photo_path: string | null;
  selected_avatar_path: string | null;
};

function isPlaceholderThought(petName: string, thoughtText: string | null) {
  return (
    !thoughtText ||
    thoughtText === `${petName} is warming up a tiny thought.` ||
    thoughtText === `today ${petName} has a little thought brewing.`
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
      downloadAppFile(pet.reference_photo_path),
      getBaseAvatarStyleAsset(),
    ]);

    if (!referencePhoto) {
      throw new Error("reference_photo_missing");
    }

    if (!baseStyleAsset) {
      throw new Error("base_avatar_style_missing");
    }

    const baseStyle = await downloadAppFile(baseStyleAsset.storage_path);

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
          generationType: "pet_avatar",
        },
      });
      const storagePath = `${pet.family_id}/pets/${pet.pet_id}/avatars/${generationGroupId}-${variant}-${randomBytes(6).toString("hex")}.png`;
      const storedFile = await uploadAppFile({
        path: storagePath,
        contentType: generated.contentType,
        bytes: generated.bytes,
      });

      await attachGeneratedAvatarCandidate({
        familyId: pet.family_id,
        petId: pet.pet_id,
        storagePath: storedFile.path,
        contentType: storedFile.contentType,
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

  return generateForPetRecord(pet);
}

async function generateForPetRecord(pet: GenerationPetRecord) {
  if (!pet.selected_avatar_path) {
    return { status: "avatar_required" as const };
  }

  const log = generationLogger({
    familyId: pet.family_id,
    petId: pet.pet_id,
    thoughtId: pet.thought_id,
    generationType: "daily_thought_image",
  });

  try {
    let thoughtId = pet.thought_id;
    let thoughtText = pet.thought_text;

    if (isPlaceholderThought(pet.pet_name, thoughtText)) {
      log.info("thought_text_generation_started");
      thoughtText = await generatePetThoughtText({
        petName: pet.pet_name,
        species: pet.species,
        metadata: {
          familyId: pet.family_id,
          petId: pet.pet_id,
          generationType: "daily_thought_text",
        },
      });
      thoughtId = await ensureDailyThoughtWithText({
        petId: pet.pet_id,
        petName: pet.pet_name,
        thoughtText,
      });
    }

    if (!thoughtId || !thoughtText) {
      return { status: "not_ready" as const };
    }

    const didMarkInProgress = await markThoughtGenerationInProgress(thoughtId);

    if (!didMarkInProgress) {
      return { status: "in_progress" as const };
    }

    log.info({ thoughtId }, "thought_image_generation_started");
    const avatar = await downloadAppFile(pet.selected_avatar_path);

    if (!avatar) {
      throw new Error("selected_avatar_missing");
    }

    const generated = await generateDailyThoughtImageBytes({
      avatar: {
        bytes: avatar.bytes,
        contentType: avatar.contentType,
      },
      petName: pet.pet_name,
      species: pet.species,
      thoughtText,
      metadata: {
        familyId: pet.family_id,
        petId: pet.pet_id,
        thoughtId,
        generationType: "daily_thought_image",
      },
    });
    const storagePath = `${pet.family_id}/thoughts/${thoughtId}/generated-${randomBytes(8).toString("hex")}.png`;
    const storedFile = await uploadAppFile({
      path: storagePath,
      contentType: generated.contentType,
      bytes: generated.bytes,
    });

    await attachGeneratedThoughtImage({
      familyId: pet.family_id,
      thoughtId,
      storagePath: storedFile.path,
      contentType: storedFile.contentType,
      prompt: generated.prompt,
    });

    await sendThoughtPublishedNotifications({
      familyId: pet.family_id,
      petName: pet.pet_name,
      thoughtText,
    });

    log.info({ thoughtId }, "thought_image_generation_succeeded");
    return { status: "succeeded" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "image_generation_failed";

    if (pet.thought_id) {
      await markThoughtGenerationFailed(pet.thought_id, message);
    }

    log.error({ error: message }, "thought_image_generation_failed");
    return { status: "failed" as const };
  }
}

export async function generateDailyThoughtImageForCron(petId: string) {
  const pet = await getPetForCronGeneration(petId, getTodayIsoDate());

  if (!pet || !pet.selected_avatar_path) {
    return { status: "not_ready" as const };
  }

  return generateForPetRecord(pet);
}
