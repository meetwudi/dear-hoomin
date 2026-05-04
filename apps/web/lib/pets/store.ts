import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "../db/client";
import * as familySql from "../db/sql/families";
import * as petSql from "../db/sql/pets";
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "../db/sql/transactions";
import { uploadAppObject } from "../storage";
import { normalizeUploadImage } from "../uploads/images";
import { resolveHoominTimeContext } from "../user-context/timezone";
import type {
  DailyThought,
  JournalPhoto,
  PetAvatarCandidate,
  PetSummary,
} from "./types";

type PetRow = {
  id: string;
  family_id: string;
  name: string;
  species: string | null;
  reference_photo_path: string | null;
  selected_avatar_path: string | null;
  avatar_generation_status: PetSummary["avatarGenerationStatus"];
  avatar_generation_error: string | null;
  avatar_candidates: PetAvatarCandidate[];
  thought_id: string | null;
  public_share_token: string | null;
  local_date: string | null;
  thought_source: DailyThought["source"] | null;
  thought_text: string | null;
  journal_text: string | null;
  image_file_id: string | null;
  image_path: string | null;
  image_generation_status: DailyThought["imageGenerationStatus"] | null;
  image_generation_error: string | null;
  today_thoughts: DailyThought[];
};

type AvatarGenerationPetRow = {
  pet_id: string;
  family_id: string;
  pet_name: string;
  species: string | null;
  avatar_generation_status: PetSummary["avatarGenerationStatus"];
  reference_photo_path: string | null;
};

type BaseAvatarStyleAssetRow = {
  object_key: string;
  content_type: string | null;
};

type DailyGenerationCandidateRow = {
  pet_id: string;
  hoomin_id: string;
  time_zone: string | null;
};

export type ThoughtImageGenerationRecord = {
  thought_id: string;
  pet_id: string;
  local_date: string;
  source: DailyThought["source"];
  thought_text: string;
  journal_text: string | null;
  image_file_id: string | null;
  image_generation_status: DailyThought["imageGenerationStatus"];
  family_id: string;
  pet_name: string;
  species: string | null;
  selected_avatar_path: string | null;
  journal_photo_path: string | null;
  journal_photo_content_type: string | null;
};

export type DailyGenerationTarget = {
  petId: string;
  localDate: string;
};

async function requireMembership(
  client: PoolClient,
  familyId: string,
  hoominId: string,
) {
  const result = await client.query(
    familySql.requireFamilyMembership,
    [familyId, hoominId],
  );

  if (result.rowCount === 0) {
    throw new Error("family_not_found");
  }
}

function toPetSummary(row: PetRow): PetSummary {
  const todayThoughts = row.today_thoughts ?? [];

  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    species: row.species,
    referencePhotoPath: row.reference_photo_path,
    selectedAvatarPath: row.selected_avatar_path,
    avatarGenerationStatus: row.avatar_generation_status,
    avatarGenerationError: row.avatar_generation_error,
    avatarCandidates: row.avatar_candidates ?? [],
    todayThought: row.thought_id
      ? {
          id: row.thought_id,
          publicShareToken: row.public_share_token ?? "",
          petId: row.id,
          localDate: row.local_date ?? "",
          source: row.thought_source ?? "daily",
          text: row.thought_text ?? "",
          journalText: row.journal_text,
          imageFileId: row.image_file_id,
          imagePath: row.image_path,
          imageGenerationStatus: row.image_generation_status ?? "not_started",
          imageGenerationError: row.image_generation_error,
          journalPhotos: [],
        }
      : null,
    todayThoughts,
  };
}

function thoughtTextForPet(petName: string) {
  return `${petName} is warming up a tiny musing.`;
}

export async function listPetsForFamily(familyId: string, hoominId: string) {
  const timeContext = await resolveHoominTimeContext(hoominId);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await requireMembership(client, familyId, hoominId);
    const result = await client.query<PetRow>(
      petSql.listPetsForFamily,
      [familyId, timeContext.localDate],
    );

    return result.rows.map(toPetSummary);
  } finally {
    client.release();
  }
}

export async function createPetWithPhoto({
  familyId,
  hoominId,
  name,
  species,
  photo,
}: {
  familyId: string;
  hoominId: string;
  name: string;
  species: string | null;
  photo: File;
}) {
  const timeContext = await resolveHoominTimeContext(hoominId);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    await requireMembership(client, familyId, hoominId);
    const petResult = await client.query<{ id: string }>(
      petSql.createPet,
      [familyId, name, species, hoominId],
    );
    const petId = petResult.rows[0].id;
    const normalizedPhoto = await normalizeUploadImage(photo);
    const extension = normalizedPhoto.extension;
    const objectKey = `${familyId}/pets/${petId}/reference-${randomBytes(8).toString("hex")}.${extension}`;

    const storedObject = await uploadAppObject({
      key: objectKey,
      contentType: normalizedPhoto.contentType,
      bytes: normalizedPhoto.bytes,
    });

    await client.query(
      petSql.createPetReferenceFile,
      [
        familyId,
        petId,
        storedObject.key,
        storedObject.contentType,
        hoominId,
      ],
    );

    await ensureDailyThought(client, petId, timeContext.localDate, name);
    await client.query(commitTransaction);
    return petId;
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePetReferencePhoto({
  familyId,
  hoominId,
  petId,
  photo,
}: {
  familyId: string;
  hoominId: string;
  petId: string;
  photo: File;
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    await requireMembership(client, familyId, hoominId);
    const normalizedPhoto = await normalizeUploadImage(photo);
    const objectKey = `${familyId}/pets/${petId}/reference-${randomBytes(8).toString("hex")}.${normalizedPhoto.extension}`;
    const storedObject = await uploadAppObject({
      key: objectKey,
      contentType: normalizedPhoto.contentType,
      bytes: normalizedPhoto.bytes,
    });

    await client.query(
      petSql.createPetReferenceFile,
      [
        familyId,
        petId,
        storedObject.key,
        storedObject.contentType,
        hoominId,
      ],
    );
    await client.query(commitTransaction);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePetProfile({
  familyId,
  hoominId,
  name,
  petId,
}: {
  familyId: string;
  hoominId: string;
  name: string;
  petId: string;
}) {
  const result = await getPool().query<{ id: string }>(
    petSql.updatePetProfile,
    [familyId, petId, name, hoominId],
  );

  if (result.rowCount === 0) {
    throw new Error("pet_not_found");
  }
}

export async function ensureDailyThought(
  client: PoolClient,
  petId: string,
  localDate: string,
  petName: string,
  thoughtText = thoughtTextForPet(petName),
) {
  const result = await client.query<{ id: string }>(
    petSql.ensureDailyThought,
    [petId, localDate, thoughtText],
  );

  return result.rows[0].id;
}

export async function ensureDailyThoughtWithText({
  petId,
  petName,
  localDate,
  thoughtText,
}: {
  petId: string;
  petName: string;
  localDate: string;
  thoughtText: string;
}) {
  const client = await getPool().connect();

  try {
    return await ensureDailyThought(
      client,
      petId,
      localDate,
      petName,
      thoughtText,
    );
  } finally {
    client.release();
  }
}

export async function getPetForGeneration(petId: string, hoominId: string) {
  const timeContext = await resolveHoominTimeContext(hoominId);
  const result = await getPool().query<{
    pet_id: string;
    family_id: string;
    pet_name: string;
    species: string | null;
    local_date: string;
    thought_id: string | null;
    thought_text: string | null;
    image_generation_status: DailyThought["imageGenerationStatus"] | null;
    reference_photo_path: string | null;
    selected_avatar_path: string | null;
    extra_instructions: string | null;
  }>(
    petSql.getPetForGeneration,
    [petId, hoominId, timeContext.localDate],
  );

  return result.rows[0] ?? null;
}

export async function getPetForCronGeneration(petId: string, localDate: string) {
  const result = await getPool().query<{
    pet_id: string;
    family_id: string;
    pet_name: string;
    species: string | null;
    local_date: string;
    thought_id: string | null;
    thought_text: string | null;
    image_generation_status: DailyThought["imageGenerationStatus"] | null;
    reference_photo_path: string | null;
    selected_avatar_path: string | null;
    extra_instructions: string | null;
  }>(petSql.getPetForCronGeneration, [petId, localDate]);

  return result.rows[0] ?? null;
}

export async function getThoughtForImageGeneration(
  thoughtId: string,
  hoominId: string,
) {
  const result = await getPool().query<ThoughtImageGenerationRecord>(
    petSql.getThoughtForImageGeneration,
    [thoughtId, hoominId],
  );

  return result.rows[0] ?? null;
}

export async function getPetForAvatarGeneration(
  petId: string,
  hoominId: string,
) {
  const result = await getPool().query<AvatarGenerationPetRow>(
    petSql.getPetForAvatarGeneration,
    [petId, hoominId],
  );

  return result.rows[0] ?? null;
}

export async function getBaseAvatarStyleAsset() {
  const result = await getPool().query<BaseAvatarStyleAssetRow>(
    petSql.getBaseAvatarStyleAsset,
  );

  return result.rows[0] ?? null;
}

export async function upsertBaseAvatarStyleAsset({
  objectKey,
  contentType,
  hoominId,
}: {
  objectKey: string;
  contentType: string;
  hoominId: string;
}) {
  await getPool().query(petSql.upsertBaseAvatarStyleAsset, [
    objectKey,
    contentType,
    hoominId,
  ]);
}

export async function markAvatarGenerationInProgress(petId: string) {
  const result = await getPool().query<{ id: string }>(
    petSql.markAvatarGenerationInProgress,
    [petId],
  );

  return result.rowCount === 1;
}

export async function markAvatarGenerationFailed(
  petId: string,
  error: string,
) {
  await getPool().query(petSql.markAvatarGenerationFailed, [
    petId,
    error.slice(0, 1000),
  ]);
}

export async function attachGeneratedAvatarCandidate({
  familyId,
  petId,
  objectKey,
  contentType,
  generationGroupId,
  instructions,
  prompt,
  hoominId,
}: {
  familyId: string;
  petId: string;
  objectKey: string;
  contentType: string;
  generationGroupId: string;
  instructions: string | null;
  prompt: string;
  hoominId: string;
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    const fileResult = await client.query<{ id: string }>(
      petSql.createAvatarCandidateFile,
      [familyId, petId, objectKey, contentType, hoominId],
    );
    await client.query(petSql.createAvatarCandidate, [
      familyId,
      petId,
      fileResult.rows[0].id,
      generationGroupId,
      instructions,
      prompt,
      hoominId,
    ]);
    await client.query(commitTransaction);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function markAvatarGenerationSucceeded(petId: string) {
  await getPool().query(petSql.markAvatarGenerationSucceeded, [petId]);
}

export async function choosePetAvatar({
  petId,
  candidateId,
  hoominId,
}: {
  petId: string;
  candidateId: string;
  hoominId: string;
}) {
  const client = await getPool().connect();

  try {
    const pet = await getPetForAvatarGeneration(petId, hoominId);

    if (!pet) {
      throw new Error("pet_not_found");
    }

    const result = await client.query(petSql.choosePetAvatar, [
      petId,
      candidateId,
    ]);

    if (result.rowCount === 0) {
      throw new Error("avatar_candidate_not_found");
    }
  } finally {
    client.release();
  }
}

export async function markThoughtGenerationInProgress(thoughtId: string) {
  const result = await getPool().query<{ id: string }>(
    petSql.markThoughtGenerationInProgress,
    [thoughtId],
  );

  return result.rowCount === 1;
}

export async function markThoughtGenerationFailed(
  thoughtId: string,
  error: string,
) {
  await getPool().query(
    petSql.markThoughtGenerationFailed,
    [thoughtId, error.slice(0, 1000)],
  );
}

export async function attachGeneratedThoughtImage({
  familyId,
  thoughtId,
  objectKey,
  contentType,
  prompt,
}: {
  familyId: string;
  thoughtId: string;
  objectKey: string;
  contentType: string;
  prompt: string;
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    const fileResult = await client.query<{ id: string }>(
      petSql.createThoughtImageFile,
      [familyId, thoughtId, objectKey, contentType],
    );

    await client.query(
      petSql.markThoughtGenerationSucceeded,
      [thoughtId, fileResult.rows[0].id, prompt],
    );

    await client.query(commitTransaction);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function listDailyGenerationCandidates() {
  const result = await getPool().query<DailyGenerationCandidateRow>(
    petSql.listDailyGenerationCandidates,
  );

  return result.rows;
}

export async function createMissingDailyThoughtsForTargets(
  targets: DailyGenerationTarget[],
) {
  if (targets.length === 0) {
    return;
  }

  await getPool().query(petSql.createMissingDailyThoughtsForPetDates, [
    targets.map((target) => target.petId),
    targets.map((target) => target.localDate),
  ]);
}

export async function listRecentThoughtTextsForPet(
  petId: string,
  localDate: string,
) {
  const result = await getPool().query<{ text: string }>(
    petSql.listRecentThoughtTextsForPet,
    [petId, localDate],
  );

  return result.rows.map((row) => row.text);
}

export async function createJournalThoughtWithPhotos({
  familyId,
  petId,
  hoominId,
  localDate,
  thoughtText,
  journalText,
  photos,
}: {
  familyId: string;
  petId: string;
  hoominId: string;
  localDate: string;
  thoughtText: string;
  journalText: string;
  photos: File[];
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    await requireMembership(client, familyId, hoominId);

    const thoughtResult = await client.query<{ id: string }>(
      petSql.createJournalThought,
      [petId, localDate, thoughtText, journalText, hoominId],
    );
    const thoughtId = thoughtResult.rows[0].id;
    const uploadedPhotos: JournalPhoto[] = [];

    for (const [index, photo] of photos.entries()) {
      const normalizedPhoto = await normalizeUploadImage(photo);
      const extension = normalizedPhoto.extension;
      const objectKey = `${familyId}/thoughts/${thoughtId}/journal-${index + 1}-${randomBytes(8).toString("hex")}.${extension}`;
      const storedObject = await uploadAppObject({
        key: objectKey,
        contentType: normalizedPhoto.contentType,
        bytes: normalizedPhoto.bytes,
      });
      const fileResult = await client.query<{ id: string }>(
        petSql.createJournalPhotoFile,
        [
          familyId,
          thoughtId,
          storedObject.key,
          storedObject.contentType,
          hoominId,
        ],
      );

      uploadedPhotos.push({
        id: fileResult.rows[0].id,
        imagePath: storedObject.key,
        contentType: storedObject.contentType,
      });
    }

    await client.query(commitTransaction);
    return { thoughtId, uploadedPhotos };
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function listTargetsDueForDailyGeneration({
  targets,
  limit,
}: {
  targets: DailyGenerationTarget[];
  limit: number;
}) {
  if (targets.length === 0) {
    return [];
  }

  const result = await getPool().query<{ id: string; local_date: string }>(
    petSql.listPetsDueForDailyGenerationForDates,
    [
      targets.map((target) => target.petId),
      targets.map((target) => target.localDate),
      limit,
    ],
  );

  return result.rows.map((row) => ({
    petId: row.id,
    localDate: row.local_date,
  }));
}
