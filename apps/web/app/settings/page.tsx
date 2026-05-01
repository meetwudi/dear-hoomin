import { redirect } from "next/navigation";
import { SessionHeader } from "../components/session-header";
import { AppTabs } from "../components/app-tabs";
import { getSession } from "../../lib/auth/session";
import { listFamiliesForHoomin } from "../../lib/families/store";
import { listPetsForFamily } from "../../lib/pets/store";
import {
  getHoominSettings,
  getNotificationPreferences,
} from "../../lib/settings/store";
import { getSupportedTimeZones } from "../../lib/timezones";
import { AvatarChooser } from "../components/avatar-chooser";
import { AddPetForm } from "../components/add-pet-form";
import { PendingSubmitButton } from "../components/pending-submit-button";
import { PhotoPicker } from "../components/photo-picker";
import {
  updateNotificationPreferencesAction,
  updatePetReferencePhotoAction,
  updateThoughtGenerationInstructionsAction,
  updateTimeZoneAction,
} from "./actions";
import { NotificationEnabler } from "./notification-enabler";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/settings");
  }

  const [families, preferences, settings] = await Promise.all([
    listFamiliesForHoomin(session.hoominId),
    getNotificationPreferences(session.hoominId),
    getHoominSettings(session.hoominId),
  ]);
  const family = families[0] ?? null;
  const pets = family
    ? await listPetsForFamily(family.id, session.hoominId)
    : [];
  const pet = pets[0] ?? null;
  const timeZones = getSupportedTimeZones();

  return (
    <main className="home-shell product-home-shell tabbed-app-shell">
      <SessionHeader session={session} />
      <section className="thought-card product-home" aria-labelledby="settings-heading">
        <div className="home-app-hero">
          <div>
            <p className="eyebrow">Furbaby</p>
            <h1 id="settings-heading">{pet?.name ?? "little one"}</h1>
          </div>
        </div>
        <AppTabs activeTab="pet" />

        {family && !pet ? (
          <div className="section-block">
            <h2>Add your pet</h2>
            <AddPetForm familyId={family.id} />
          </div>
        ) : null}

        {pet ? (
          <div className="section-block">
            {pet.selectedAvatarPath ? (
              <div className="pet-card-media settings-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name} selected avatar`} src={`/files/${pet.selectedAvatarPath}`} />
              </div>
            ) : (
              <p className="supporting-copy compact-copy">
                Pick a little face so thoughts have a consistent look.
              </p>
            )}
            <AvatarChooser
              avatarInstructions={settings.thoughtGenerationInstructions}
              pet={pet}
            />
          </div>
        ) : null}

        {pet ? (
          <div className="section-block">
            <h2>How {pet.name} looks like in real world</h2>
            {pet.referencePhotoPath ? (
              <div className="pet-card-media settings-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name} original upload`} src={`/files/${pet.referencePhotoPath}`} />
              </div>
            ) : null}
            <form action={updatePetReferencePhotoAction} className="stacked-form">
              <input name="familyId" type="hidden" value={pet.familyId} />
              <input name="petId" type="hidden" value={pet.id} />
              <label>
                Upload one real-world photo
                <PhotoPicker name="photo" required />
              </label>
              <PendingSubmitButton pendingLabel="Uploading...">
                Replace real-world photo
              </PendingSubmitButton>
            </form>
          </div>
        ) : null}

        <div className="section-block">
          <h2>About {pet?.name ?? "your furbaby"}</h2>
          <form action={updateThoughtGenerationInstructionsAction} className="stacked-form">
            <label>
              Tell us a bit more about {pet?.name ?? "your furbaby"}
              <textarea
                defaultValue={settings.thoughtGenerationInstructions ?? ""}
                maxLength={1000}
                name="instructions"
                placeholder="likes dramatic snack updates, suspicious of laundry, always alert..."
                rows={4}
              />
            </label>
            <button className="primary-button" type="submit">
              Save furbaby notes
            </button>
          </form>
        </div>

        <div className="section-block">
          <h2>Daily musing time</h2>
          <p className="supporting-copy compact-copy">
            Dear Hoomin makes each daily musing at 6am in this timezone.
          </p>
          <form action={updateTimeZoneAction} className="stacked-form">
            <label>
              Timezone
              <select name="timeZone" defaultValue={settings.timeZone}>
                {timeZones.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              Save timezone
            </button>
          </form>
        </div>

        <div className="section-block">
          <h2>Notifications</h2>
          <p className="supporting-copy compact-copy">
            Want a tiny nudge when your pet posts a thought?
          </p>
          <NotificationEnabler />
          <form action={updateNotificationPreferencesAction} className="toggle-form">
            <label className="toggle-row">
              <input
                defaultChecked={preferences.allEnabled}
                name="allEnabled"
                type="checkbox"
              />
              All tiny nudges
            </label>
            <label className="toggle-row">
              <input
                defaultChecked={preferences.thoughtPublishedEnabled}
                name="thoughtPublishedEnabled"
                type="checkbox"
              />
              Daily musing ready
            </label>
            <button className="primary-button" type="submit">
              Save nudges
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
