import { redirect } from "next/navigation";
import { SessionHeader } from "../components/session-header";
import { getSession } from "../../lib/auth/session";
import { listFamiliesForHoomin } from "../../lib/families/store";
import { listPetsForFamily } from "../../lib/pets/store";
import {
  getHoominSettings,
  getNotificationPreferences,
} from "../../lib/settings/store";
import { getSupportedTimeZones } from "../../lib/timezones";
import { createPetAction } from "../pets/actions";
import { AvatarChooser } from "../components/avatar-chooser";
import {
  updateNotificationPreferencesAction,
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
    <main className="app-shell">
      <SessionHeader session={session} />
      <section className="app-panel" aria-labelledby="settings-heading">
        <div className="panel-heading">
          <p className="eyebrow">Settings</p>
          <h1 id="settings-heading">cozy knobs.</h1>
        </div>

        {family && !pet ? (
          <div className="section-block">
            <h2>Add your pet</h2>
            <form action={createPetAction} className="pet-form">
              <input name="familyId" type="hidden" value={family.id} />
              <label>
                Pet name
                <input maxLength={80} name="name" placeholder="Mochi" required />
              </label>
              <label>
                Species
                <input maxLength={80} name="species" placeholder="cat, dog..." />
              </label>
              <label>
                Reference photo
                <input
                  accept="image/jpeg,image/png,image/webp"
                  name="photo"
                  required
                  type="file"
                />
              </label>
              <button className="primary-button" type="submit">
                Add pet
              </button>
            </form>
          </div>
        ) : null}

        {pet ? (
          <div className="section-block">
            <h2>{pet.name}&apos;s avatar</h2>
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
          </div>
        ) : null}

        {pet ? (
          <div className="section-block">
            <h2>{pet.name}&apos;s original photo</h2>
            {pet.referencePhotoPath ? (
              <div className="pet-card-media settings-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name} original upload`} src={`/files/${pet.referencePhotoPath}`} />
              </div>
            ) : null}
          </div>
        ) : null}

        {pet ? <AvatarChooser pet={pet} /> : null}

        <div className="section-block">
          <h2>Daily thought time</h2>
          <p className="supporting-copy compact-copy">
            Dear Hoomin makes each daily thought at 6am in this timezone.
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
              Pet thought published
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
