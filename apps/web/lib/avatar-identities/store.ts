import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "../db/client";
import * as avatarSql from "../db/sql/avatar-identities";
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "../db/sql/transactions";
import { uploadAppObject } from "../storage";
import { normalizeUploadImage } from "../uploads/images";
import type { AvatarIdentity, AvatarSubjectType } from "./types";

type AvatarIdentityRow = {
  id: string;
  family_id: string;
  subject_type: AvatarSubjectType;
  subject_id: string;
  display_name: string;
  reference_name: string | null;
  reference_photo_path: string | null;
  selected_avatar_path: string | null;
  avatar_generation_status: AvatarIdentity["avatarGenerationStatus"];
  avatar_generation_error: string | null;
  avatar_candidates: AvatarIdentity["avatarCandidates"];
};

async function requireMembership(
  client: PoolClient,
  familyId: string,
  hoominId: string,
) {
  const result = await client.query(
    avatarSql.requireFamilyMembership,
    [familyId, hoominId],
  );

  if (result.rowCount === 0) {
    throw new Error("family_not_found");
  }
}

function normalizeSubjectType(subjectType: string): AvatarSubjectType {
  if (
    subjectType === "pet" ||
    subjectType === "hoomin" ||
    subjectType === "companion_object"
  ) {
    return subjectType;
  }

  throw new Error("avatar_subject_type_invalid");
}

function toAvatarIdentity(row: AvatarIdentityRow): AvatarIdentity {
  return {
    id: row.id,
    familyId: row.family_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    displayName: row.display_name,
    referenceName: row.reference_name,
    referencePhotoPath: row.reference_photo_path,
    selectedAvatarPath: row.selected_avatar_path,
    avatarGenerationStatus: row.avatar_generation_status,
    avatarGenerationError: row.avatar_generation_error,
    avatarCandidates: row.avatar_candidates ?? [],
  };
}

export type ReferencedHoominAvatar = {
  referenceName: string;
  avatarPath: string;
};

function normalizeReferenceName(referenceName: string | null) {
  const normalized = referenceName?.trim().replace(/\s+/g, " ").slice(0, 40) ?? "";

  return normalized || null;
}

export function parseAvatarSubjectType(subjectType: string) {
  return normalizeSubjectType(subjectType);
}

export async function getAvatarIdentityForSubject({
  familyId,
  subjectType,
  subjectId,
  hoominId,
}: {
  familyId: string;
  subjectType: AvatarSubjectType;
  subjectId: string;
  hoominId: string;
}) {
  const result = await getPool().query<AvatarIdentityRow>(
    avatarSql.getAvatarIdentityForSubject,
    [familyId, subjectType, subjectId, hoominId],
  );

  return result.rows[0] ? toAvatarIdentity(result.rows[0]) : null;
}

export async function listAvatarIdentitiesForSubjects({
  familyId,
  subjectType,
  subjectIds,
  hoominId,
}: {
  familyId: string;
  subjectType: AvatarSubjectType;
  subjectIds: string[];
  hoominId: string;
}) {
  if (subjectIds.length === 0) {
    return [];
  }

  const result = await getPool().query<AvatarIdentityRow>(
    avatarSql.listAvatarIdentitiesForSubjects,
    [familyId, subjectType, subjectIds, hoominId],
  );

  return result.rows.map(toAvatarIdentity);
}

export async function updateHoominAvatarReferenceName({
  displayName,
  familyId,
  hoominId,
  referenceName,
  subjectId,
}: {
  displayName: string;
  familyId: string;
  hoominId: string;
  referenceName: string | null;
  subjectId: string;
}) {
  const client = await getPool().connect();

  try {
    await client.query(beginTransaction);
    await requireMembership(client, familyId, hoominId);
    await requireSubjectAllowed(client, familyId, "hoomin", subjectId);
    await client.query(avatarSql.updateAvatarReferenceName, [
      familyId,
      "hoomin",
      subjectId,
      displayName.trim().slice(0, 120),
      normalizeReferenceName(referenceName),
    ]);
    await client.query(commitTransaction);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function listReferencedHoominAvatarsForFamily(familyId: string) {
  const result = await getPool().query<{
    reference_name: string;
    avatar_path: string;
  }>(avatarSql.listReferencedHoominAvatarsForFamily, [familyId]);

  return result.rows.map((row) => ({
    referenceName: row.reference_name,
    avatarPath: row.avatar_path,
  }));
}

async function requireSubjectAllowed(
  client: PoolClient,
  familyId: string,
  subjectType: AvatarSubjectType,
  subjectId: string,
) {
  if (subjectType !== "hoomin") {
    return;
  }

  const result = await client.query(
    avatarSql.requireHoominSubjectInFamily,
    [familyId, subjectId],
  );

  if (result.rowCount === 0) {
    throw new Error("avatar_subject_forbidden");
  }
}

export async function uploadAvatarReferencePhoto({
  familyId,
  subjectType,
  subjectId,
  displayName,
  hoominId,
  photo,
}: {
  familyId: string;
  subjectType: AvatarSubjectType;
  subjectId: string;
  displayName: string;
  hoominId: string;
  photo: File;
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    await requireMembership(client, familyId, hoominId);
    await requireSubjectAllowed(client, familyId, subjectType, subjectId);

    const identityResult = await client.query<{ id: string }>(
      avatarSql.upsertAvatarIdentity,
      [familyId, subjectType, subjectId, displayName],
    );
    const identityId = identityResult.rows[0].id;
    const normalizedPhoto = await normalizeUploadImage(photo);
    const objectKey =
      `${familyId}/avatars/${identityId}/reference-${randomBytes(8).toString("hex")}.${normalizedPhoto.extension}`;
    const storedObject = await uploadAppObject({
      key: objectKey,
      contentType: normalizedPhoto.contentType,
      bytes: normalizedPhoto.bytes,
    });

    await client.query(
      avatarSql.createAvatarReferenceFile,
      [
        familyId,
        identityId,
        storedObject.key,
        storedObject.contentType,
        hoominId,
      ],
    );
    await client.query(commitTransaction);

    return identityId;
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function chooseAvatarCandidate({
  avatarIdentityId,
  candidateId,
  hoominId,
}: {
  avatarIdentityId: string;
  candidateId: string;
  hoominId: string;
}) {
  const client = await getPool().connect();

  try {
    await client.query(beginTransaction);
    const membershipResult = await client.query(
      `
        select 1
        from public.avatar_identities identity
        join public.family_memberships membership
          on membership.family_id = identity.family_id
          and membership.hoomin_id = $2
        where identity.id = $1
        limit 1
      `,
      [avatarIdentityId, hoominId],
    );

    if (membershipResult.rowCount === 0) {
      throw new Error("avatar_identity_not_found");
    }

    const result = await client.query(avatarSql.chooseAvatarCandidate, [
      avatarIdentityId,
      candidateId,
    ]);

    if (result.rowCount === 0) {
      throw new Error("avatar_candidate_not_found");
    }

    await client.query(commitTransaction);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function markAvatarIdentityGenerationInProgress(
  avatarIdentityId: string,
) {
  const result = await getPool().query<{ id: string }>(
    avatarSql.markAvatarGenerationInProgress,
    [avatarIdentityId],
  );

  return result.rowCount === 1;
}

export async function markAvatarIdentityGenerationFailed(
  avatarIdentityId: string,
  error: string,
) {
  await getPool().query(avatarSql.markAvatarGenerationFailed, [
    avatarIdentityId,
    error.slice(0, 1000),
  ]);
}

export async function markAvatarIdentityGenerationSucceeded(
  avatarIdentityId: string,
) {
  await getPool().query(avatarSql.markAvatarGenerationSucceeded, [
    avatarIdentityId,
  ]);
}

export async function attachGeneratedAvatarIdentityCandidate({
  avatarIdentityId,
  contentType,
  familyId,
  generationGroupId,
  hoominId,
  instructions,
  objectKey,
  prompt,
}: {
  avatarIdentityId: string;
  contentType: string;
  familyId: string;
  generationGroupId: string;
  hoominId: string;
  instructions: string | null;
  objectKey: string;
  prompt: string;
}) {
  const client = await getPool().connect();

  try {
    await client.query(beginTransaction);
    const fileResult = await client.query<{ id: string }>(
      avatarSql.createAvatarCandidateFile,
      [familyId, avatarIdentityId, objectKey, contentType, hoominId],
    );
    await client.query(avatarSql.createAvatarCandidate, [
      familyId,
      avatarIdentityId,
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
