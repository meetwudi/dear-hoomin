"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth/session";
import {
  updateHoominTimeZone,
  updateNotificationPreferences,
} from "../../lib/settings/store";

export async function updateTimeZoneAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/settings");
  }

  const timeZone = formData.get("timeZone");

  if (typeof timeZone !== "string") {
    throw new Error("time_zone_required");
  }

  await updateHoominTimeZone({
    hoominId: session.hoominId,
    timeZone,
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/settings");
  }

  await updateNotificationPreferences({
    hoominId: session.hoominId,
    allEnabled: formData.get("allEnabled") === "on",
    thoughtPublishedEnabled: formData.get("thoughtPublishedEnabled") === "on",
  });
  revalidatePath("/settings");
}
