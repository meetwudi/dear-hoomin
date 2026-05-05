import { notFound, redirect } from "next/navigation";
import { SessionHeader } from "../../components/session-header";
import { AddPetForm } from "../../components/add-pet-form";
import { AppTabs } from "../../components/app-tabs";
import { FurbabySelector } from "../../components/furbaby-selector";
import { PendingSubmitButton } from "../../components/pending-submit-button";
import { getSession } from "../../../lib/auth/session";
import { listAvatarIdentitiesForSubjects } from "../../../lib/avatar-identities/store";
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
  updateFamilyAvatarPhotoAction,
  updateFamilyFurbabyDetailsAction,
  updateFamilyHoominReferenceNameAction,
  updateFamilyNotificationPreferencesAction,
  chooseFamilyAvatarCandidateAction,
  generateFamilyAvatarCandidatesAction,
  removeFamilyMemberAction,
  updateFamilyTimeZoneAction,
} from "../actions";
import { choosePetAvatarAction, generatePetAvatarsAction } from "../../pets/actions";
import { AvatarDialog } from "../avatar-dialog";
import { HoominMusingNameEditor } from "../hoomin-musing-name-editor";
import { InviteMemberDialog } from "../invite-member-dialog";
import { NotificationSettingsGate } from "../notification-enabler";
import { NotificationPreferencesForm } from "../notification-preferences-form";
import { productCopy } from "../../../lib/product-copy";
import { buildSiteUrl } from "../../../lib/site-url";

type FamilyPageProps = {
  params: Promise<{
    familyId: string;
  }>;
  searchParams?: Promise<{
    addPet?: string;
    avatarSubject?: string;
    petId?: string;
  }>;
};

export default async function FamilyPage({ params, searchParams }: FamilyPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { familyId } = await params;
  const [
    family,
    families,
    members,
    invites,
    pets,
    settings,
    preferences,
  ] = await Promise.all([
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
  const hoominAvatarIdentities = await listAvatarIdentitiesForSubjects({
    familyId,
    subjectType: "hoomin",
    subjectIds: members.map((member) => member.hoominId),
    hoominId: session.hoominId,
  });
  const hoominAvatarIdentityBySubjectId = new Map(
    hoominAvatarIdentities.map((identity) => [identity.subjectId, identity]),
  );
  const { addPet, avatarSubject, petId } = (await searchParams) ?? {};
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
          <div className="section-heading-row">
            <h2>{productCopy.family.membersHeading}</h2>
            <InviteMemberDialog
              createInviteAction={createFamilyInviteAction}
              familyId={family.id}
              latestInviteUrl={latestInviteUrl}
            />
          </div>
          <ul className="member-list">
            {members.map((member) => {
              const hoominAvatarIdentity =
                hoominAvatarIdentityBySubjectId.get(member.hoominId) ?? null;

              return (
              <li key={member.hoominId}>
                <span className="member-identity">
                  <span className="member-display-name">
                    {member.displayName ?? member.email}
                    <HoominMusingNameEditor
                      action={updateFamilyHoominReferenceNameAction}
                      currentName={
                        hoominAvatarIdentity?.referenceName ?? null
                      }
                      displayName={member.displayName ?? member.email}
                      familyId={family.id}
                      redirectTo={familyPath}
                      subjectId={member.hoominId}
                    />
                  </span>
                  <small>{member.email}</small>
                </span>
                <div className="member-actions">
                  <strong>{member.role}</strong>
                  <AvatarDialog
                    avatarIdentity={hoominAvatarIdentity}
                    chooseAction={
                      hoominAvatarIdentity ? chooseFamilyAvatarCandidateAction : undefined
                    }
                    chooseFields={(candidate) => (
                      <>
                        <input name="familyId" type="hidden" value={family.id} />
                        <input
                          name="avatarIdentityId"
                          type="hidden"
                          value={hoominAvatarIdentity?.id ?? ""}
                        />
                        <input name="candidateId" type="hidden" value={candidate.id} />
                      </>
                    )}
                    currentImageAlt={productCopy.media.hoominAvatarAlt(
                      member.displayName ?? member.email,
                    )}
                    displayName={member.displayName ?? member.email}
                    emptyMessage={productCopy.avatars.hoominEmpty(
                      member.displayName ?? member.email,
                    )}
                    familyId={family.id}
                    generateAction={
                      hoominAvatarIdentity
                        ? generateFamilyAvatarCandidatesAction
                        : undefined
                    }
                    generateFields={
                      <>
                        <input name="familyId" type="hidden" value={family.id} />
                        <input name="subjectType" type="hidden" value="hoomin" />
                        <input
                          name="subjectId"
                          type="hidden"
                          value={member.hoominId}
                        />
                      </>
                    }
                    heading={productCopy.avatars.hoominHeading}
                    initialOpen={avatarSubject === `hoomin:${member.hoominId}`}
                    redirectTo={familyPath}
                    subjectId={member.hoominId}
                    subjectType="hoomin"
                    uploadAction={updateFamilyAvatarPhotoAction}
                  />
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
              );
            })}
          </ul>
          <datalist id="hoomin-musing-name-suggestions">
            {productCopy.family.musingNameSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
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
              <div className="furbaby-avatar-stack">
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
                  ) : (
                    <span className="placeholder-pet compact-placeholder">
                      {productCopy.home.noPet.visual}
                    </span>
                  )}
                </div>
                <AvatarDialog
                  buttonLabel={productCopy.avatars.changeButton}
                  candidates={selectedPet.avatarCandidates.map((candidate) => ({
                    id: candidate.id,
                    fileId: candidate.fileId,
                    imagePath: candidate.imagePath,
                    selectedAt: candidate.selectedAt,
                  }))}
                  chooseAction={choosePetAvatarAction}
                  chooseFields={(candidate) => (
                    <>
                      <input name="petId" type="hidden" value={selectedPet.id} />
                      <input name="candidateId" type="hidden" value={candidate.id} />
                    </>
                  )}
                  currentImageAlt={productCopy.media.selectedAvatarAlt(selectedPet.name)}
                  displayName={selectedPet.name}
                  emptyMessage={productCopy.avatars.petEmpty(selectedPet.name)}
                  familyId={family.id}
                  generationError={selectedPet.avatarGenerationError}
                  generationStatus={selectedPet.avatarGenerationStatus}
                  generateAction={generatePetAvatarsAction}
                  generateFields={
                    <>
                      <input name="petId" type="hidden" value={selectedPet.id} />
                      <input
                        name="instructions"
                        type="hidden"
                        value={settings.thoughtGenerationInstructions ?? ""}
                      />
                    </>
                  }
                  heading={productCopy.avatars.heading(selectedPet.name)}
                  referencePhotoPath={selectedPet.referencePhotoPath}
                  redirectTo={selectedPetPath}
                  selectedAvatarPath={selectedPet.selectedAvatarPath}
                  subjectId={selectedPet.id}
                  subjectType="pet"
                  uploadAction={updateFamilyAvatarPhotoAction}
                />
              </div>
              <div className="pet-card-body">
                <form action={updateFamilyFurbabyDetailsAction} className="stacked-form compact-form">
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
                    {productCopy.family.saveFurbabyButton}
                  </PendingSubmitButton>
                </form>
              </div>
            </div>
          ) : null}
        </div>

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
          <NotificationSettingsGate>
            <NotificationPreferencesForm
              action={updateFamilyNotificationPreferencesAction}
              familyId={family.id}
              preferences={preferences}
              redirectTo={familyPath}
            />
          </NotificationSettingsGate>
        </div>
      </section>
    </main>
  );
}
