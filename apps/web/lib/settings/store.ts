import { getPool } from "../db/client";
import * as settingsSql from "../db/sql/settings";
import { defaultTimeZone, validateTimeZone } from "../timezones";

export type HoominSettings = {
  timeZone: string;
  thoughtGenerationInstructions: string | null;
};

export type NotificationPreferences = {
  allEnabled: boolean;
  thoughtPublishedEnabled: boolean;
};

type HoominSettingsRow = {
  time_zone: string | null;
  thought_generation_instructions: string | null;
};

type NotificationPreferencesRow = {
  all_enabled: boolean;
  thought_published_enabled: boolean;
};

function toHoominSettings(row: HoominSettingsRow): HoominSettings {
  return {
    timeZone: validateTimeZone(row.time_zone ?? defaultTimeZone),
    thoughtGenerationInstructions: row.thought_generation_instructions,
  };
}

function toNotificationPreferences(
  row: NotificationPreferencesRow,
): NotificationPreferences {
  return {
    allEnabled: row.all_enabled,
    thoughtPublishedEnabled: row.thought_published_enabled,
  };
}

export async function getHoominSettings(hoominId: string) {
  const result = await getPool().query<HoominSettingsRow>(
    settingsSql.getHoominSettings,
    [hoominId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("hoomin_not_found");
  }

  return toHoominSettings(row);
}

export async function getHoominTimeZone(hoominId: string) {
  const settings = await getHoominSettings(hoominId);

  return settings.timeZone;
}

export async function updateHoominTimeZone({
  hoominId,
  timeZone,
}: {
  hoominId: string;
  timeZone: string;
}) {
  const validTimeZone = validateTimeZone(timeZone);
  const result = await getPool().query<HoominSettingsRow>(
    settingsSql.updateHoominTimeZone,
    [hoominId, validTimeZone],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("hoomin_not_found");
  }

  return toHoominSettings(row);
}

export async function updateThoughtGenerationInstructions({
  hoominId,
  instructions,
}: {
  hoominId: string;
  instructions: string | null;
}) {
  const normalized = instructions?.trim() ? instructions.trim().slice(0, 1000) : null;
  const result = await getPool().query<HoominSettingsRow>(
    settingsSql.updateThoughtGenerationInstructions,
    [hoominId, normalized],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("hoomin_not_found");
  }

  return toHoominSettings(row);
}

export async function getNotificationPreferences(hoominId: string) {
  const result = await getPool().query<NotificationPreferencesRow>(
    settingsSql.getNotificationPreferences,
    [hoominId],
  );

  return toNotificationPreferences(result.rows[0]);
}

export async function updateNotificationPreferences({
  hoominId,
  allEnabled,
  thoughtPublishedEnabled,
}: {
  hoominId: string;
  allEnabled: boolean;
  thoughtPublishedEnabled: boolean;
}) {
  const result = await getPool().query<NotificationPreferencesRow>(
    settingsSql.updateNotificationPreferences,
    [hoominId, allEnabled, thoughtPublishedEnabled],
  );

  return toNotificationPreferences(result.rows[0]);
}
