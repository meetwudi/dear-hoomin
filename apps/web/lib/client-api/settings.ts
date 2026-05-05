import {
  getHoominSettings,
  getNotificationPreferences,
  updateHoominTimeZone,
  updateNotificationPreferences,
  updateThoughtGenerationInstructions,
} from "../settings/store";
import type { ApiContext } from "./http";

export type UpdateSettingsInput = {
  timeZone?: string;
  thoughtGenerationInstructions?: string | null;
};

export type UpdateNotificationPreferencesInput = {
  allEnabled?: boolean;
  thoughtPublishedEnabled?: boolean;
};

export async function getSettingsCapability({ session }: ApiContext) {
  const [settings, notificationPreferences] = await Promise.all([
    getHoominSettings(session.hoominId),
    getNotificationPreferences(session.hoominId),
  ]);

  return {
    settings,
    notificationPreferences,
  };
}

export async function updateSettingsCapability(
  { session }: ApiContext,
  input: UpdateSettingsInput,
) {
  let settings = await getHoominSettings(session.hoominId);

  if (input.timeZone !== undefined) {
    settings = await updateHoominTimeZone({
      hoominId: session.hoominId,
      timeZone: input.timeZone,
    });
  }

  if (input.thoughtGenerationInstructions !== undefined) {
    settings = await updateThoughtGenerationInstructions({
      hoominId: session.hoominId,
      instructions: input.thoughtGenerationInstructions,
    });
  }

  return { settings };
}

export async function updateNotificationPreferencesCapability(
  { session }: ApiContext,
  input: UpdateNotificationPreferencesInput,
) {
  const current = await getNotificationPreferences(session.hoominId);
  const notificationPreferences = await updateNotificationPreferences({
    hoominId: session.hoominId,
    allEnabled: input.allEnabled ?? current.allEnabled,
    thoughtPublishedEnabled:
      input.thoughtPublishedEnabled ?? current.thoughtPublishedEnabled,
  });

  return { notificationPreferences };
}
