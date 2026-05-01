import type { PoolClient } from "pg";
import { getPool } from "../db/client";
import * as authSql from "../db/sql/auth";
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "../db/sql/transactions";
import type { AuthProviderProfile } from "./providers";

export type HoominIdentity = {
  hoominId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type HoominRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
};

async function findAccount(
  client: PoolClient,
  profile: AuthProviderProfile,
) {
  const result = await client.query<HoominRow>(
    authSql.findAuthAccount,
    [profile.provider, profile.providerSubject],
  );

  return result.rows[0] ?? null;
}

async function upsertHoominByEmail(
  client: PoolClient,
  profile: AuthProviderProfile,
) {
  const result = await client.query<HoominRow>(
    authSql.upsertHoominByEmail,
    [profile.email, profile.displayName, profile.avatarUrl],
  );

  return result.rows[0];
}

async function upsertAccount(
  client: PoolClient,
  hoominId: string,
  profile: AuthProviderProfile,
) {
  await client.query(
    authSql.upsertAuthAccount,
    [
      hoominId,
      profile.provider,
      profile.providerSubject,
      profile.email,
      profile.displayName,
      profile.avatarUrl,
    ],
  );
}

function toIdentity(row: HoominRow): HoominIdentity {
  return {
    hoominId: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

export async function findOrCreateHoominForProviderProfile(
  profile: AuthProviderProfile,
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(beginTransaction);

    const existingHoomin = await findAccount(client, profile);

    if (existingHoomin) {
      await client.query(
        authSql.updateHoominProfileFromProvider,
        [
          existingHoomin.id,
          profile.email,
          profile.displayName,
          profile.avatarUrl,
        ],
      );
      await upsertAccount(client, existingHoomin.id, profile);
      await client.query(commitTransaction);

      return {
        hoominId: existingHoomin.id,
        email: profile.email,
        displayName: profile.displayName ?? existingHoomin.display_name,
        avatarUrl: profile.avatarUrl ?? existingHoomin.avatar_url,
      };
    }

    const hoomin = await upsertHoominByEmail(client, profile);
    await upsertAccount(client, hoomin.id, profile);
    await client.query(commitTransaction);

    return toIdentity(hoomin);
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}
