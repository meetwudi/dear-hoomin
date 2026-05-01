import { notFound, redirect } from "next/navigation";
import { SessionHeader } from "../../components/session-header";
import { getSession } from "../../../lib/auth/session";
import {
  getFamilyForHoomin,
  listFamiliesForHoomin,
  listFamilyInvites,
  listFamilyMembers,
} from "../../../lib/families/store";
import { getRequestOrigin } from "../../../lib/http/origin";
import { listPetsForFamily } from "../../../lib/pets/store";
import {
  createFamilyInviteAction,
  removeFamilyMemberAction,
} from "../actions";
import {
  createPetAction,
  generatePetImageAction,
} from "../../pets/actions";

type FamilyPageProps = {
  params: Promise<{
    familyId: string;
  }>;
};

export default async function FamilyPage({ params }: FamilyPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { familyId } = await params;
  const [family, families, members, invites, pets, origin] = await Promise.all([
    getFamilyForHoomin(familyId, session.hoominId),
    listFamiliesForHoomin(session.hoominId),
    listFamilyMembers(familyId, session.hoominId),
    listFamilyInvites(familyId, session.hoominId),
    listPetsForFamily(familyId, session.hoominId),
    getRequestOrigin(),
  ]);

  if (!family) {
    notFound();
  }

  const latestInvite = invites[0] ?? null;
  const latestInviteUrl = latestInvite
    ? `${origin}/invite/${latestInvite.inviteToken}`
    : null;
  const canManageMembers = family.role === "owner";

  return (
    <main className="app-shell">
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
            <label className="copy-field">
              Latest invite link
              <input readOnly value={latestInviteUrl} />
            </label>
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

        {pets.length === 0 ? (
          <div className="section-block">
            <h2>Add pet</h2>
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
                <input accept="image/jpeg,image/png,image/webp" name="photo" required type="file" />
              </label>
              <button className="primary-button" type="submit">
                Add pet
              </button>
            </form>
          </div>
        ) : null}

        {pets.length > 0 ? (
          <div className="section-block">
            <h2>Pets</h2>
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
                        <img alt={`${pet.name} daily thought`} src={imageUrl} />
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
                      <p>{thought?.text ?? "today's thought is waiting."}</p>
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
                        <a className="primary-link" href="/settings">
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
      </section>
    </main>
  );
}
