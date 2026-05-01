import { redirect } from "next/navigation";
import { SessionHeader } from "./components/session-header";
import { AvatarChooser } from "./components/avatar-chooser";
import { ShareThoughtButton } from "./components/share-thought-button";
import { getSession } from "../lib/auth/session";
import { formatThoughtDate } from "../lib/dates/thoughts";
import { listFamiliesForHoomin } from "../lib/families/store";
import { getRequestOrigin } from "../lib/http/origin";
import { listPetsForFamily } from "../lib/pets/store";
import { createFamilyAction } from "./families/actions";
import { generatePetImageAction } from "./pets/actions";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [families, origin] = await Promise.all([
    listFamiliesForHoomin(session.hoominId),
    getRequestOrigin(),
  ]);
  const family = families[0] ?? null;
  const pets = family
    ? await listPetsForFamily(family.id, session.hoominId)
    : [];
  const pet = pets[0] ?? null;
  const thought = pet?.todayThought ?? null;
  const thoughtImageUrl = thought?.imagePath ? `/files/${thought.imagePath}` : null;
  const isThoughtImageInFlight =
    thought?.imageGenerationStatus === "in_progress" && !thoughtImageUrl;
  const oldThoughtReady = Boolean(thought?.text);
  const heading = pet
    ? `what's ${pet.name} thinking?`
    : family
      ? "who's thinking today?"
      : "ready for tiny thoughts?";

  return (
    <main className="home-shell">
      <SessionHeader session={session} />
      <section className="thought-card" aria-labelledby="home-heading">
        <p className="eyebrow">Dear Hoomin</p>
        <h1 id="home-heading">{heading}</h1>

        {!family ? (
          <>
            <p className="supporting-copy">
              Make a little home first, then your pet can start posting tiny
              thoughts.
            </p>
            <form action={createFamilyAction} className="stacked-form">
              <label>
                Family name
                <input
                  maxLength={100}
                  name="name"
                  placeholder="Mochi's household"
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                Create family
              </button>
            </form>
          </>
        ) : !pet ? (
          <>
            <div className="placeholder-pet" aria-hidden="true">
              ?
            </div>
            <p className="supporting-copy">
              No pet here yet. Add one little face before the daily thoughts can
              begin.
            </p>
            <a className="primary-link" href="/settings">
              Add pet
            </a>
          </>
        ) : !pet.selectedAvatarPath ? (
          <AvatarChooser pet={pet} />
        ) : (
          <>
            {thoughtImageUrl ? (
              <div className="daily-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name}'s thought`} src={thoughtImageUrl} />
              </div>
            ) : isThoughtImageInFlight ? (
              <div className="daily-visual loading-visual" aria-live="polite">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name}'s avatar`} src={`/files/${pet.selectedAvatarPath}`} />
                <div className="loading-pill">
                  <span className="loading-spinner" aria-hidden="true" />
                  Drawing today&apos;s picture
                </div>
              </div>
            ) : (
              <div className="thought-empty-visual" aria-hidden="true">
                <span>soon</span>
              </div>
            )}
            <p className="thought-date">{formatThoughtDate(thought?.localDate)}</p>
            <p className="pet-thought">
              {thought?.text ?? `${pet.name} is still deciding what to tell the hoomin.`}
            </p>
            {thought?.publicShareToken && thoughtImageUrl ? (
              <ShareThoughtButton
                cardUrl={`/share/${thought.publicShareToken}/card`}
                petName={pet.name}
                shareUrl={`${origin}/share/${thought.publicShareToken}`}
              />
            ) : null}
            {isThoughtImageInFlight ? (
              <p className="admin-status">
                {pet.name} is thinking real hard. Old thoughts can stay cozy here.
              </p>
            ) : null}
            {!thoughtImageUrl && thought?.imageGenerationStatus !== "in_progress" ? (
              <form action={generatePetImageAction} className="stacked-form">
                <input name="familyId" type="hidden" value={family.id} />
                <input name="petId" type="hidden" value={pet.id} />
                <button className="primary-button" type="submit">
                  Make today&apos;s thought
                </button>
              </form>
            ) : null}
            {!oldThoughtReady ? (
              <p className="admin-status">A fresh thought will appear after the first doodle.</p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
