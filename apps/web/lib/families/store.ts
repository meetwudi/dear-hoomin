import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "../db/client";
import * as familySql from "../db/sql/families";
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "../db/sql/transactions";
import type {
  FamilyInvite,
  FamilyMember,
  FamilySummary,
  InviteLookup,
} from "./types";

type FamilySummaryRow = {
  id: string;
  name: string;
  role: "owner" | "member";
  member_count: string;
};

type FamilyMemberRow = {
  hoomin_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "member";
  created_at: Date;
};

type FamilyInviteRow = {
  id: string;
  family_id: string;
  family_name: string;
  invite_token: string;
  created_at: Date;
  expires_at: Date | null;
  accepted_at: Date | null;
};

type InviteLookupRow = FamilyInviteRow & {
  is_member: boolean;
  member_count: string;
};

function createInviteToken() {
  return randomBytes(24).toString("base64url");
}

function toFamilySummary(row: FamilySummaryRow): FamilySummary {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    memberCount: Number(row.member_count),
  };
}

function toFamilyInvite(row: FamilyInviteRow): FamilyInvite {
  return {
    id: row.id,
    familyId: row.family_id,
    familyName: row.family_name,
    inviteToken: row.invite_token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  };
}

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

async function requireOwner(
  client: PoolClient,
  familyId: string,
  hoominId: string,
) {
  const result = await client.query(
    familySql.requireFamilyOwner,
    [familyId, hoominId],
  );

  if (result.rowCount === 0) {
    throw new Error("family_owner_required");
  }
}

export async function listFamiliesForHoomin(hoominId: string) {
  const result = await getPool().query<FamilySummaryRow>(
    familySql.listFamiliesForHoomin,
    [hoominId],
  );

  return result.rows.map(toFamilySummary);
}

export async function getFamilyForHoomin(
  familyId: string,
  hoominId: string,
) {
  const result = await getPool().query<FamilySummaryRow>(
    familySql.getFamilyForHoomin,
    [familyId, hoominId],
  );

  return result.rows[0] ? toFamilySummary(result.rows[0]) : null;
}

export async function listFamilyMembers(
  familyId: string,
  hoominId: string,
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await requireMembership(client, familyId, hoominId);

    const result = await client.query<FamilyMemberRow>(
      familySql.listFamilyMembers,
      [familyId],
    );

    return result.rows.map((row): FamilyMember => ({
      hoominId: row.hoomin_id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      role: row.role,
      createdAt: row.created_at,
    }));
  } finally {
    client.release();
  }
}

export async function createFamily(name: string, hoominId: string) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);

    const familyResult = await client.query<{ id: string }>(
      familySql.createFamily,
      [name, hoominId],
    );
    const familyId = familyResult.rows[0].id;

    await client.query(familySql.createOwnerMembership, [familyId, hoominId]);

    await client.query(commitTransaction);
    return familyId;
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function createFamilyInvite(
  familyId: string,
  hoominId: string,
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    await requireMembership(client, familyId, hoominId);

    const result = await client.query<FamilyInviteRow>(
      familySql.createFamilyInvite,
      [familyId, createInviteToken(), hoominId],
    );

    await client.query(commitTransaction);
    return toFamilyInvite(result.rows[0]);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function listFamilyInvites(
  familyId: string,
  hoominId: string,
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await requireMembership(client, familyId, hoominId);

    const result = await client.query<FamilyInviteRow>(
      familySql.listFamilyInvites,
      [familyId],
    );

    return result.rows.map(toFamilyInvite);
  } finally {
    client.release();
  }
}

export async function getInviteForHoomin(
  inviteToken: string,
  hoominId: string,
) {
  const result = await getPool().query<InviteLookupRow>(
    familySql.getInviteForHoomin,
    [inviteToken, hoominId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    inviteId: row.id,
    familyId: row.family_id,
    familyName: row.family_name,
    inviteToken: row.invite_token,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
    isMember: row.is_member,
    memberCount: Number(row.member_count),
  } satisfies InviteLookup;
}

export async function acceptFamilyInvite(
  inviteToken: string,
  hoominId: string,
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);

    const inviteResult = await client.query<{
      id: string;
      family_id: string;
      expires_at: Date | null;
    }>(familySql.lockInviteForAcceptance, [inviteToken]);

    const invite = inviteResult.rows[0];

    if (!invite) {
      throw new Error("invite_not_found");
    }

    if (invite.expires_at && invite.expires_at < new Date()) {
      throw new Error("invite_expired");
    }

    await client.query(familySql.createMemberMembership, [
      invite.family_id,
      hoominId,
    ]);

    await client.query(familySql.markInviteAccepted, [invite.id, hoominId]);

    await client.query(commitTransaction);
    return invite.family_id;
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function removeFamilyMember(
  familyId: string,
  ownerHoominId: string,
  targetHoominId: string,
) {
  if (ownerHoominId === targetHoominId) {
    throw new Error("owner_self_remove_not_supported");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);
    await requireOwner(client, familyId, ownerHoominId);

    await client.query(familySql.removeNonOwnerMember, [
      familyId,
      targetHoominId,
    ]);

    await client.query(commitTransaction);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}
