import { notFound, redirect } from "next/navigation";
import { SessionHeader } from "../../components/session-header";
import { AddPetForm } from "../../components/add-pet-form";
import { AppTabs } from "../../components/app-tabs";
import { AvatarChooser } from "../../components/avatar-chooser";
import { CopyInviteLink } from "../../components/copy-invite-link";
import { FurbabySelector } from "../../components/furbaby-selector";
import { PendingSubmitButton } from "../../components/pending-submit-button";
import { PhotoPicker } from "../../components/photo-picker";
import { getSession } from "../../../lib/auth/session";
import {
  getFamilyForHoomin,
  listFamiliesForHoomin,
  listFamilyInvites,
  listFamilyMembers,
} from "../../../lib/families/store";
import { listPetsForFamily } from "../../../lib/pets/store";
import {
  getHoominSettings,
  getNotificationPreferences,
} from "../../../lib/settings/store";
import { getSupportedTimeZones } from "../../../lib/timezones";
import {
  createFamilyInviteAction,
  updateFamilyNotificationPreferencesAction,
  removeFamilyMemberAction,
  updateFamilyPetReferencePhotoAction,
  updateFamilyTimeZoneAction,
  updateFamilyFurbabyNotesAction,
  updateFurbabyProfileAction,
} from "../actions";
import {
  generatePetImageAction,
} from "../../pets/actions";
import { NotificationEnabler } from "../notification-enabler";
import { buildSiteUrl } from "../../../lib/site-url";

type FamilyPageProps = {
  params: Promise<{
    familyId: string;
  }>;
  searchParams?: Promise<{
    addPet?: string;
    petId?: string;
  }>;
};

export default async function FamilyPage({ params, searchParams }: FamilyPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { familyId } = await params;
  const [family, families, members, invites, pets, settings, preferences] = await Promise.all([
    getFamilyForHoomin(familyId, session.hoominId),
    listFamiliesForHoomin(session.hoominId),
    listFamilyMembers(familyId, session.hoominId),
    listFamilyInvites(familyId, session.hoominId),
    listPetsForFamily(familyId, session.hoominId),
    getHoominSettings(session.hoominId),
    getNotificationPreferences(session.hoominId),
  ]);

  if (!family) {
    notFound();
  }

  const latestInvite = invites[0] ?? null;
  const latestInviteUrl = latestInvite
    ? buildSiteUrl(`/invite/${latestInvite.inviteToken}`)
    : null;
  const canManageMembers = family.role === "owner";
  const { addPet, petId } = (await searchParams) ?? {};
  const selectedPet = pets.find((pet) => pet.id === petId) ?? pets[0] ?? null;
  const showAddPetForm = addPet === "1" || pets.length === 0;
  const familyPath = `/families/${family.id}`;
  const selectedPetPath = selectedPet
    ? `${familyPath}?petId=${selectedPet.id}`
    : familyPath;
  const timeZones = getSupportedTimeZones();

  return (
    <main className="app-shell tabbed-app-shell">
      <SessionHeader session={session} />
      <section className="app-panel" aria-labelledby="family-heading">
        <div className="panel-heading">
          <p className="eyebrow">Family</p>
          <h1 id="family-heading">{family.name}</h1>
          <p className="supporting-copy">
            {family.memberCount} hoomin{family.memberCount === 1 ? "" : "s"} in
            this family.
          </p>
        </div>

        <AppTabs
          activeTab="family"
          familyHref={familyPath}
        />

        {families.length > 1 ? (
          <nav className="family-switcher" aria-label="Families">
            {families.map((familyOption) => (
              <a
                aria-current={
                  familyOption.id === family.id ? "page" : undefined
                }
                href={`/families/${familyOption.id}`}
                key={familyOption.id}
              >
                {familyOption.name}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="section-block">
          <h2>Invite hoomins</h2>
          <form action={createFamilyInviteAction}>
            <input name="familyId" type="hidden" value={family.id} />
            <button className="primary-button" type="submit">
              Create invite link
            </button>
          </form>
          {latestInviteUrl ? (
            <CopyInviteLink inviteUrl={latestInviteUrl} />
          ) : null}
        </div>

        <div className="section-block">
          <h2>Members</h2>
          <ul className="member-list">
            {members.map((member) => (
              <li key={member.hoominId}>
                <span>
                  {member.displayName ?? member.email}
                  <small>{member.email}</small>
                </span>
                <div className="member-actions">
                  <strong>{member.role}</strong>
                  {canManageMembers &&
                  member.role !== "owner" &&
                  member.hoominId !== session.hoominId ? (
                    <form action={removeFamilyMemberAction}>
                      <input name="familyId" type="hidden" value={family.id} />
                      <input
                        name="targetHoominId"
                        type="hidden"
                        value={member.hoominId}
                      />
                      <button className="danger-button" type="submit">
                        Remove
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="section-block">
          <div className="section-heading-row">
            <h2>Furbabies</h2>
            {pets.length > 0 ? (
              <a className="primary-link" href={`${familyPath}?addPet=1`}>
                Add furbaby
              </a>
            ) : null}
          </div>

          {pets.length > 0 && selectedPet ? (
            <div className="furbaby-controls">
              <FurbabySelector
                familyId={family.id}
                pets={pets}
                selectedPetId={selectedPet.id}
              />
            </div>
          ) : null}

          {showAddPetForm ? (
            <div className="inline-add-furbaby">
              <h3>Add furbaby</h3>
              <AddPetForm familyId={family.id} redirectTo={familyPath} />
            </div>
          ) : null}

          {selectedPet ? (
            <div className="selected-furbaby">
              <div className="pet-card-media settings-avatar">
                {selectedPet.selectedAvatarPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`${selectedPet.name} selected avatar`} src={`/files/${selectedPet.selectedAvatarPath}`} />
                ) : selectedPet.referencePhotoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={selectedPet.name} src={`/files/${selectedPet.referencePhotoPath}`} />
                ) : null}
              </div>
              <div className="pet-card-body">
                <form action={updateFurbabyProfileAction} className="stacked-form compact-form">
                  <input name="familyId" type="hidden" value={family.id} />
                  <input name="petId" type="hidden" value={selectedPet.id} />
                  <label>
                    Furbaby name
                    <input
                      defaultValue={selectedPet.name}
                      maxLength={80}
                      name="name"
                      required
                    />
                  </label>
                  <PendingSubmitButton pendingLabel="Saving...">
                    Save furbaby
                  </PendingSubmitButton>
                </form>
                <form action={updateFamilyPetReferencePhotoAction} className="stacked-form compact-form">
                  <input name="familyId" type="hidden" value={family.id} />
                  <input name="petId" type="hidden" value={selectedPet.id} />
                  <input name="redirectTo" type="hidden" value={selectedPetPath} />
                  <label>
                    Real-world photo
                    <PhotoPicker name="photo" required />
                  </label>
                  <PendingSubmitButton pendingLabel="Uploading...">
                    Replace photo
                  </PendingSubmitButton>
                </form>
                <form action={updateFamilyFurbabyNotesAction} className="stacked-form compact-form">
                  <input name="familyId" type="hidden" value={family.id} />
                  <input name="petId" type="hidden" value={selectedPet.id} />
                  <label>
                    Tell us a bit more about {selectedPet.name}
                    <textarea
                      defaultValue={settings.thoughtGenerationInstructions ?? ""}
                      maxLength={1000}
                      name="instructions"
                      placeholder="likes dramatic snack updates, suspicious of laundry, always alert..."
                      rows={4}
                    />
                  </label>
                  <PendingSubmitButton pendingLabel="Saving...">
                    Save furbaby notes
                  </PendingSubmitButton>
                </form>
                <AvatarChooser pet={selectedPet} redirectTo={selectedPetPath} />
              </div>
            </div>
          ) : null}
        </div>

        {pets.length > 0 ? (
          <div className="section-block">
            <h2>Today&apos;s furbaby musings</h2>
            <ul className="pet-list">
              {pets.map((pet) => {
                const thought = pet.todayThought;
                const imageUrl = thought?.imagePath
                  ? `/files/${thought.imagePath}`
                  : null;
                const isGenerating =
                  thought?.imageGenerationStatus === "in_progress";
                const canGenerate =
                  thought &&
                  pet.selectedAvatarPath &&
                  !imageUrl &&
                  !isGenerating;

                return (
                  <li key={pet.id}>
                    <div className="pet-card-media">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={`${pet.name} daily musing`} src={imageUrl} />
                      ) : pet.selectedAvatarPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={pet.name} src={`/files/${pet.selectedAvatarPath}`} />
                      ) : pet.referencePhotoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={pet.name} src={`/files/${pet.referencePhotoPath}`} />
                      ) : null}
                    </div>
                    <div className="pet-card-body">
                      <h3>{pet.name}</h3>
                      <p>{thought?.text ?? "today's musing is waiting."}</p>
                      {isGenerating ? (
                        <small>Picture generation is in flight.</small>
                      ) : thought?.imageGenerationStatus === "failed" ? (
                        <small>Picture generation failed. Try again.</small>
                      ) : imageUrl ? (
                        <small>Today's picture is ready.</small>
                      ) : (
                        <small>No picture generated yet.</small>
                      )}
                      {!pet.selectedAvatarPath ? (
                        <a className="primary-link" href={`${familyPath}?petId=${pet.id}`}>
                          Choose avatar
                        </a>
                      ) : canGenerate ? (
                        <form action={generatePetImageAction}>
                          <input name="familyId" type="hidden" value={family.id} />
                          <input name="petId" type="hidden" value={pet.id} />
                          <button className="primary-button" type="submit">
                            Generate picture
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="section-block">
          <h2>Daily musing time</h2>
          <p className="supporting-copy compact-copy">
            Dear Hoomin makes each daily musing at 6am in this timezone.
          </p>
          <form action={updateFamilyTimeZoneAction} className="stacked-form">
            <input name="familyId" type="hidden" value={family.id} />
            <input name="redirectTo" type="hidden" value={familyPath} />
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
            <PendingSubmitButton pendingLabel="Saving...">
              Save timezone
            </PendingSubmitButton>
          </form>
        </div>

        <div className="section-block">
          <h2>Notifications</h2>
          <p className="supporting-copy compact-copy">
            Want a tiny nudge when your pet posts a thought?
          </p>
          <NotificationEnabler />
          <form action={updateFamilyNotificationPreferencesAction} className="toggle-form">
            <input name="familyId" type="hidden" value={family.id} />
            <input name="redirectTo" type="hidden" value={familyPath} />
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
            <PendingSubmitButton pendingLabel="Saving...">
              Save nudges
            </PendingSubmitButton>
          </form>
        </div>
      </section>
    </main>
  );
}
