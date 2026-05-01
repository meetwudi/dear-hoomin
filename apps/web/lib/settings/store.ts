import { getPool } from "../db/client";
import * as settingsSql from "../db/sql/settings";

export type NotificationPreferences = {
  allEnabled: boolean;
  thoughtPublishedEnabled: boolean;
};

type NotificationPreferencesRow = {
  all_enabled: boolean;
  thought_published_enabled: boolean;
};

function toNotificationPreferences(
  row: NotificationPreferencesRow,
): NotificationPreferences {
  return {
    allEnabled: row.all_enabled,
    thoughtPublishedEnabled: row.thought_published_enabled,
  };
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
