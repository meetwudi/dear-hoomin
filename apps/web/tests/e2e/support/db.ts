import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Pool } from "pg";

type TestHoomin = {
  id: string;
  email: string;
  name: string;
};

let pool: Pool | null = null;

function getPool() {
  const databaseUrl = process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error("Missing POSTGRES_URL");
  }

  pool ??= new Pool({
    connectionString: databaseUrl,
  });

  return pool;
}

export async function createTestHoomin(name = "E2E Hoomin"): Promise<TestHoomin> {
  const runId = randomUUID();
  const email = `e2e-${runId}@example.test`;
  const result = await getPool().query<TestHoomin>(
    `
      insert into public.hoomins (email, display_name)
      values ($1, $2)
      returning id, email, display_name as name
    `,
    [email, name],
  );

  return result.rows[0];
}

export async function createTestFamily(hoominId: string, name = "E2E household") {
  const familyResult = await getPool().query<{ id: string }>(
    `
      insert into public.families (name, created_by)
      values ($1, $2)
      returning id
    `,
    [`${name}-${randomUUID()}`, hoominId],
  );
  const familyId = familyResult.rows[0].id;

  await getPool().query(
    `
      insert into public.family_memberships (family_id, hoomin_id, role)
      values ($1, $2, 'owner')
    `,
    [familyId, hoominId],
  );

  return { id: familyId };
}

function findTimeZoneAtLocalHour(localHour: number, instant = new Date()) {
  const timeZones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : ["America/Los_Angeles"];

  for (const timeZone of timeZones) {
    const hour = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .find((part) => part.type === "hour")?.value;

    if (Number(hour) === localHour) {
      return timeZone;
    }
  }

  throw new Error(`No supported time zone is currently at local hour ${localHour}`);
}

export async function seedCronReadyPet() {
  const storageRoot = process.env.APP_LOCAL_STORAGE_DIR;

  if (!storageRoot) {
    throw new Error("Missing APP_LOCAL_STORAGE_DIR");
  }

  const timeZone = findTimeZoneAtLocalHour(6);
  const hoomin = await createTestHoomin("Cron E2E Hoomin");

  await getPool().query("update public.hoomins set time_zone = $1 where id = $2", [
    timeZone,
    hoomin.id,
  ]);

  const family = await createTestFamily(hoomin.id, "Cron E2E household");
  const petResult = await getPool().query<{ id: string }>(
    `
      insert into public.pets (family_id, name, species, created_by)
      values ($1, 'Mochi', 'cat', $2)
      returning id
    `,
    [family.id, hoomin.id],
  );
  const petId = petResult.rows[0].id;
  const objectKey = `${family.id}/pets/${petId}/avatars/e2e-selected.svg`;
  const objectPath = join(storageRoot, objectKey);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#fff8ed"/><circle cx="512" cy="420" r="220" fill="#f7c86f"/><text x="512" y="800" text-anchor="middle" font-family="Arial" font-size="72" font-weight="700" fill="#2c2416">Mochi</text></svg>`;

  await mkdir(dirname(objectPath), { recursive: true });
  await writeFile(objectPath, svg);
  await writeFile(`${objectPath}.content-type`, "image/svg+xml");

  const fileResult = await getPool().query<{ id: string }>(
    `
      insert into public.uploaded_files (
        family_id,
        owner_type,
        owner_id,
        file_kind,
        object_key,
        content_type,
        uploaded_by
      )
      values ($1, 'pet', $2, 'pet_avatar_candidate', $3, 'image/svg+xml', $4)
      returning id
    `,
    [family.id, petId, objectKey, hoomin.id],
  );

  await getPool().query(
    "update public.pets set selected_avatar_file_id = $1 where id = $2",
    [fileResult.rows[0].id, petId],
  );

  return {
    hoominId: hoomin.id,
    petId,
    timeZone,
  };
}

export async function getDailyThoughtForPet(petId: string) {
  const result = await getPool().query<{
    id: string;
    text: string;
    image_generation_status: string;
    image_file_id: string | null;
  }>(
    `
      select id, text, image_generation_status, image_file_id
      from public.daily_thoughts
      where pet_id = $1
        and source = 'daily'
      order by created_at desc
      limit 1
    `,
    [petId],
  );

  return result.rows[0] ?? null;
}

export async function listPushSubscriptionsForHoomin(hoominId: string) {
  const result = await getPool().query<{
    client_id: string | null;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent: string | null;
  }>(
    `
      select client_id, endpoint, p256dh, auth, user_agent
      from public.push_subscriptions
      where hoomin_id = $1
      order by created_at asc
    `,
    [hoominId],
  );

  return result.rows;
}

export async function cleanupTestHoomin(hoominId: string) {
  await getPool().query("delete from public.families where created_by = $1", [hoominId]);
  await getPool().query("delete from public.hoomins where id = $1", [hoominId]);
}

export async function seedPublicThought() {
  const hoomin = await createTestHoomin("Public Share E2E");
  const familyResult = await getPool().query<{ id: string }>(
    `
      insert into public.families (name, created_by)
      values ($1, $2)
      returning id
    `,
    [`e2e-public-family-${randomUUID()}`, hoomin.id],
  );
  const familyId = familyResult.rows[0].id;

  await getPool().query(
    `
      insert into public.family_memberships (family_id, hoomin_id, role)
      values ($1, $2, 'owner')
    `,
    [familyId, hoomin.id],
  );

  const petResult = await getPool().query<{ id: string }>(
    `
      insert into public.pets (family_id, name, species, created_by)
      values ($1, 'Mochi', 'cat', $2)
      returning id
    `,
    [familyId, hoomin.id],
  );

  const thoughtResult = await getPool().query<{ public_share_token: string }>(
    `
      insert into public.daily_thoughts (pet_id, local_date, text, public_share_token)
      values (
        $1,
        current_date,
        'i inspected the sunbeam and found it acceptable.',
        encode(extensions.gen_random_bytes(24), 'hex')
      )
      returning public_share_token
    `,
    [petResult.rows[0].id],
  );

  return {
    hoominId: hoomin.id,
    token: thoughtResult.rows[0].public_share_token,
  };
}

export async function seedBaseAvatarStyle() {
  const storageRoot = process.env.APP_LOCAL_STORAGE_DIR;

  if (!storageRoot) {
    throw new Error("Missing APP_LOCAL_STORAGE_DIR");
  }

  const objectKey = "system/avatar-styles/e2e-base.svg";
  const objectPath = join(storageRoot, objectKey);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#fff8ed"/><circle cx="512" cy="420" r="220" fill="#f7c86f"/><text x="512" y="800" text-anchor="middle" font-family="Arial" font-size="72" font-weight="700" fill="#2c2416">base style</text></svg>`;

  await mkdir(dirname(objectPath), { recursive: true });
  await writeFile(objectPath, svg);
  await writeFile(`${objectPath}.content-type`, "image/svg+xml");

  await getPool().query(
    `
      insert into public.app_assets (asset_key, object_key, content_type)
      values ('base_pet_avatar_style', $1, 'image/svg+xml')
      on conflict (asset_key) do update
      set object_key = excluded.object_key,
          content_type = excluded.content_type,
          updated_at = now()
    `,
    [objectKey],
  );
}

export async function writePetPhotoFixture() {
  const storageRoot = process.env.APP_LOCAL_STORAGE_DIR;

  if (!storageRoot) {
    throw new Error("Missing APP_LOCAL_STORAGE_DIR");
  }

  const fixturePath = join(storageRoot, "fixtures", "pet-photo.png");
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

  await mkdir(dirname(fixturePath), { recursive: true });
  await writeFile(fixturePath, Buffer.from(pngBase64, "base64"));

  return fixturePath;
}

export async function closeDb() {
  await pool?.end();
  pool = null;
}
