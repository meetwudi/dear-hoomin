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
import { productCopy } from "../../../lib/product-copy";
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
          <p className="eyebrow">{productCopy.family.eyebrow}</p>
          <h1 id="family-heading">{family.name}</h1>
          <p className="supporting-copy">
            {productCopy.family.memberCount(family.memberCount)}
          </p>
        </div>

        <AppTabs
          activeTab="family"
          familyHref={familyPath}
        />

        {families.length > 1 ? (
          <nav className="family-switcher" aria-label={productCopy.family.familiesLabel}>
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
          <h2>{productCopy.family.inviteHeading}</h2>
          <form action={createFamilyInviteAction}>
            <input name="familyId" type="hidden" value={family.id} />
            <button className="primary-button" type="submit">
              {productCopy.family.createInviteButton}
            </button>
          </form>
          {latestInviteUrl ? (
            <CopyInviteLink inviteUrl={latestInviteUrl} />
          ) : null}
        </div>

        <div className="section-block">
          <h2>{productCopy.family.membersHeading}</h2>
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
                        {productCopy.family.removeButton}
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
            <h2>{productCopy.family.furbabiesHeading}</h2>
            {pets.length > 0 ? (
              <a className="primary-link" href={`${familyPath}?addPet=1`}>
                {productCopy.family.addPetHeading}
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
              <h3>{productCopy.family.addFurbabyHeading}</h3>
              <AddPetForm familyId={family.id} redirectTo={familyPath} />
            </div>
          ) : null}

          {selectedPet ? (
            <div className="selected-furbaby">
              <div className="pet-card-media settings-avatar">
                {selectedPet.selectedAvatarPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={productCopy.media.selectedAvatarAlt(selectedPet.name)}
                    src={`/files/${selectedPet.selectedAvatarPath}`}
                  />
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
                    {productCopy.family.furbabyNameLabel}
                    <input
                      defaultValue={selectedPet.name}
                      maxLength={80}
                      name="name"
                      required
                    />
                  </label>
                  <PendingSubmitButton pendingLabel={productCopy.family.savingButton}>
                    {productCopy.family.saveFurbabyButton}
                  </PendingSubmitButton>
                </form>
                <form action={updateFamilyPetReferencePhotoAction} className="stacked-form compact-form">
                  <input name="familyId" type="hidden" value={family.id} />
                  <input name="petId" type="hidden" value={selectedPet.id} />
                  <input name="redirectTo" type="hidden" value={selectedPetPath} />
                  <label>
                    {productCopy.family.realWorldPhotoLabel}
                    <PhotoPicker name="photo" required />
                  </label>
                  <PendingSubmitButton pendingLabel={productCopy.avatars.uploadingButton}>
                    {productCopy.family.replacePhotoButton}
                  </PendingSubmitButton>
                </form>
                <form action={updateFamilyFurbabyNotesAction} className="stacked-form compact-form">
                  <input name="familyId" type="hidden" value={family.id} />
                  <input name="petId" type="hidden" value={selectedPet.id} />
                  <label>
                    {productCopy.settings.tellUsLabel(selectedPet.name)}
                    <textarea
                      defaultValue={settings.thoughtGenerationInstructions ?? ""}
                      maxLength={1000}
                      name="instructions"
                      placeholder={productCopy.settings.notesPlaceholder}
                      rows={4}
                    />
                  </label>
                  <PendingSubmitButton pendingLabel={productCopy.family.savingButton}>
                    {productCopy.settings.saveNotesButton}
                  </PendingSubmitButton>
                </form>
                <AvatarChooser pet={selectedPet} redirectTo={selectedPetPath} />
              </div>
            </div>
          ) : null}
        </div>

        {pets.length > 0 ? (
          <div className="section-block">
            <h2>{productCopy.family.todayMusingsHeading}</h2>
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
                        <img alt={productCopy.media.dailyMusingAlt(pet.name)} src={imageUrl} />
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
                      <p>{thought?.text ?? productCopy.family.musingWaiting}</p>
                      {isGenerating ? (
                        <small>{productCopy.family.pictureInFlight}</small>
                      ) : thought?.imageGenerationStatus === "failed" ? (
                        <small>{productCopy.family.pictureFailed}</small>
                      ) : imageUrl ? (
                        <small>{productCopy.family.pictureReady}</small>
                      ) : (
                        <small>{productCopy.family.noPicture}</small>
                      )}
                      {!pet.selectedAvatarPath ? (
                        <a className="primary-link" href={`${familyPath}?petId=${pet.id}`}>
                          {productCopy.family.chooseAvatarLink}
                        </a>
                      ) : canGenerate ? (
                        <form action={generatePetImageAction}>
                          <input name="familyId" type="hidden" value={family.id} />
                          <input name="petId" type="hidden" value={pet.id} />
                          <button className="primary-button" type="submit">
                            {productCopy.family.generatePictureButton}
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
          <h2>{productCopy.settings.dailyMusingHeading}</h2>
          <p className="supporting-copy compact-copy">
            {productCopy.settings.dailyMusingIntro}
          </p>
          <form action={updateFamilyTimeZoneAction} className="stacked-form">
            <input name="familyId" type="hidden" value={family.id} />
            <input name="redirectTo" type="hidden" value={familyPath} />
            <label>
              {productCopy.settings.timezoneLabel}
              <select name="timeZone" defaultValue={settings.timeZone}>
                {timeZones.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </select>
            </label>
            <PendingSubmitButton pendingLabel={productCopy.family.savingButton}>
              {productCopy.settings.saveTimezoneButton}
            </PendingSubmitButton>
          </form>
        </div>

        <div className="section-block">
          <h2>{productCopy.settings.notificationsHeading}</h2>
          <p className="supporting-copy compact-copy">
            {productCopy.settings.notificationsIntro}
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
              {productCopy.settings.allNudgesLabel}
            </label>
            <label className="toggle-row">
              <input
                defaultChecked={preferences.thoughtPublishedEnabled}
                name="thoughtPublishedEnabled"
                type="checkbox"
              />
              {productCopy.settings.dailyMusingReadyLabel}
            </label>
            <PendingSubmitButton pendingLabel={productCopy.family.savingButton}>
              {productCopy.settings.saveNudgesButton}
            </PendingSubmitButton>
          </form>
        </div>
      </section>
    </main>
  );
}
