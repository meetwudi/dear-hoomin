import type { PoolClient } from "pg";
import { getPool } from "../db/client";
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
    `
      select
        hoomins.id,
        hoomins.email,
        hoomins.display_name,
        hoomins.avatar_url
      from public.auth_accounts account
      join public.hoomins hoomins on hoomins.id = account.hoomin_id
      where account.provider = $1
        and account.provider_subject = $2
      limit 1
    `,
    [profile.provider, profile.providerSubject],
  );

  return result.rows[0] ?? null;
}

async function upsertHoominByEmail(
  client: PoolClient,
  profile: AuthProviderProfile,
) {
  const result = await client.query<HoominRow>(
    `
      insert into public.hoomins (email, display_name, avatar_url)
      values ($1, $2, $3)
      on conflict (email) do update
      set
        display_name = coalesce(excluded.display_name, public.hoomins.display_name),
        avatar_url = coalesce(excluded.avatar_url, public.hoomins.avatar_url)
      returning id, email, display_name, avatar_url
    `,
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
    `
      insert into public.auth_accounts (
        hoomin_id,
        provider,
        provider_subject,
        email,
        display_name,
        avatar_url,
        last_login_at
      )
      values ($1, $2, $3, $4, $5, $6, now())
      on conflict (provider, provider_subject) do update
      set
        email = excluded.email,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        last_login_at = now()
    `,
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
    await client.query("begin");

    const existingHoomin = await findAccount(client, profile);

    if (existingHoomin) {
      await client.query(
        `
          update public.hoomins
          set
            email = $2,
            display_name = coalesce($3, display_name),
            avatar_url = coalesce($4, avatar_url)
          where id = $1
        `,
        [
          existingHoomin.id,
          profile.email,
          profile.displayName,
          profile.avatarUrl,
        ],
      );
      await upsertAccount(client, existingHoomin.id, profile);
      await client.query("commit");

      return {
        hoominId: existingHoomin.id,
        email: profile.email,
        displayName: profile.displayName ?? existingHoomin.display_name,
        avatarUrl: profile.avatarUrl ?? existingHoomin.avatar_url,
      };
    }

    const hoomin = await upsertHoominByEmail(client, profile);
    await upsertAccount(client, hoomin.id, profile);
    await client.query("commit");

    return toIdentity(hoomin);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
