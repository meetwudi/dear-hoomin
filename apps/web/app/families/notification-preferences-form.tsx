"use client";

import { useState } from "react";
import { productCopy } from "../../lib/product-copy";
import type { NotificationPreferences } from "../../lib/settings/store";
import { PendingSubmitButton } from "../components/pending-submit-button";

export function NotificationPreferencesForm({
  action,
  familyId,
  preferences,
  redirectTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  familyId: string;
  preferences: NotificationPreferences;
  redirectTo: string;
}) {
  const [allEnabled, setAllEnabled] = useState(preferences.allEnabled);
  const [thoughtPublishedEnabled, setThoughtPublishedEnabled] = useState(
    preferences.allEnabled && preferences.thoughtPublishedEnabled,
  );

  return (
    <form action={action} className="toggle-form">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <label className="toggle-row">
        <input
          checked={allEnabled}
          name="allEnabled"
          onChange={(event) => {
            const nextEnabled = event.currentTarget.checked;

            setAllEnabled(nextEnabled);
            setThoughtPublishedEnabled(nextEnabled);
          }}
          type="checkbox"
        />
        {productCopy.settings.allNudgesLabel}
      </label>
      <label className="toggle-row">
        <input
          checked={thoughtPublishedEnabled}
          disabled={!allEnabled}
          name="thoughtPublishedEnabled"
          onChange={(event) => {
            const nextEnabled = event.currentTarget.checked;

            setThoughtPublishedEnabled(nextEnabled);
            if (nextEnabled) {
              setAllEnabled(true);
            }
          }}
          type="checkbox"
        />
        {productCopy.settings.dailyMusingReadyLabel}
      </label>
      <PendingSubmitButton pendingLabel={productCopy.family.savingButton}>
        {productCopy.settings.saveNudgesButton}
      </PendingSubmitButton>
    </form>
  );
}
