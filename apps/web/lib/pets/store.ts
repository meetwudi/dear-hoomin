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
import { uploadAppFile } from "../storage/supabase-storage";
import type { DailyThought, PetAvatarCandidate, PetSummary } from "./types";

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
  thought_text: string | null;
  image_file_id: string | null;
  image_path: string | null;
  image_generation_status: DailyThought["imageGenerationStatus"] | null;
  image_generation_error: string | null;
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
  storage_path: string;
  content_type: string | null;
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
          text: row.thought_text ?? "",
          imageFileId: row.image_file_id,
          imagePath: row.image_path,
          imageGenerationStatus: row.image_generation_status ?? "not_started",
          imageGenerationError: row.image_generation_error,
        }
      : null,
  };
}

function thoughtTextForPet(petName: string) {
  return `${petName} is warming up a tiny thought.`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayIsoDate() {
  return todayIsoDate();
}

export async function listPetsForFamily(familyId: string, hoominId: string) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await requireMembership(client, familyId, hoominId);
    const localDate = todayIsoDate();
    const result = await client.query<PetRow>(
      petSql.listPetsForFamily,
      [familyId, localDate],
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
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    await requireMembership(client, familyId, hoominId);
    const existingPetsResult = await client.query<{ count: number }>(
      petSql.countPetsForFamily,
      [familyId],
    );

    if ((existingPetsResult.rows[0]?.count ?? 0) > 0) {
      throw new Error("pet_limit_reached");
    }

    const petResult = await client.query<{ id: string }>(
      petSql.createPet,
      [familyId, name, species, hoominId],
    );
    const petId = petResult.rows[0].id;
    const extension = photo.type === "image/png" ? "png" : "jpg";
    const storagePath = `${familyId}/pets/${petId}/reference-${randomBytes(8).toString("hex")}.${extension}`;
    const bytes = Buffer.from(await photo.arrayBuffer());

    const storedFile = await uploadAppFile({
      path: storagePath,
      contentType: photo.type,
      bytes,
    });

    await client.query(
      petSql.createPetReferenceFile,
      [
        familyId,
        petId,
        storedFile.bucket,
        storedFile.path,
        storedFile.contentType,
        hoominId,
      ],
    );

    await ensureDailyThought(client, petId, name);
    await client.query(commitTransaction);
    return petId;
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureDailyThought(
  client: PoolClient,
  petId: string,
  petName: string,
  thoughtText = thoughtTextForPet(petName),
) {
  const result = await client.query<{ id: string }>(
    petSql.ensureDailyThought,
    [petId, todayIsoDate(), thoughtText],
  );

  return result.rows[0].id;
}

export async function ensureDailyThoughtWithText({
  petId,
  petName,
  thoughtText,
}: {
  petId: string;
  petName: string;
  thoughtText: string;
}) {
  const client = await getPool().connect();

  try {
    return await ensureDailyThought(client, petId, petName, thoughtText);
  } finally {
    client.release();
  }
}

export async function getPetForGeneration(petId: string, hoominId: string) {
  const result = await getPool().query<{
    pet_id: string;
    family_id: string;
    pet_name: string;
    species: string | null;
    thought_id: string | null;
    thought_text: string | null;
    image_generation_status: DailyThought["imageGenerationStatus"] | null;
    reference_photo_path: string | null;
    selected_avatar_path: string | null;
  }>(
    petSql.getPetForGeneration,
    [petId, hoominId, todayIsoDate()],
  );

  return result.rows[0] ?? null;
}

export async function getPetForCronGeneration(petId: string, localDate: string) {
  const result = await getPool().query<{
    pet_id: string;
    family_id: string;
    pet_name: string;
    species: string | null;
    thought_id: string | null;
    thought_text: string | null;
    image_generation_status: DailyThought["imageGenerationStatus"] | null;
    reference_photo_path: string | null;
    selected_avatar_path: string | null;
  }>(petSql.getPetForCronGeneration, [petId, localDate]);

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
  storagePath,
  contentType,
  hoominId,
}: {
  storagePath: string;
  contentType: string;
  hoominId: string;
}) {
  await getPool().query(petSql.upsertBaseAvatarStyleAsset, [
    storagePath,
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
  storagePath,
  contentType,
  generationGroupId,
  instructions,
  prompt,
  hoominId,
}: {
  familyId: string;
  petId: string;
  storagePath: string;
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
      [familyId, petId, storagePath, contentType, hoominId],
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
  storagePath,
  contentType,
  prompt,
}: {
  familyId: string;
  thoughtId: string;
  storagePath: string;
  contentType: string;
  prompt: string;
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    const fileResult = await client.query<{ id: string }>(
      petSql.createThoughtImageFile,
      [familyId, thoughtId, storagePath, contentType],
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

export async function createMissingDailyThoughtsForDate(localDate: string) {
  await getPool().query(petSql.createMissingDailyThoughtsForToday, [localDate]);
}

export async function listPetIdsDueForDailyGeneration({
  localDate,
  limit,
}: {
  localDate: string;
  limit: number;
}) {
  const result = await getPool().query<{ id: string }>(
    petSql.listPetsDueForDailyGeneration,
    [localDate, limit],
  );

  return result.rows.map((row) => row.id);
}
