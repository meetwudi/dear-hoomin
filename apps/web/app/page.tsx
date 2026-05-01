import { redirect } from "next/navigation";
import { SessionHeader } from "./components/session-header";
import { AppTabs } from "./components/app-tabs";
import { AvatarChooser } from "./components/avatar-chooser";
import { PendingSubmitButton } from "./components/pending-submit-button";
import {
  TimelineEntryCard,
  type TimelineEntry,
  type TimelineEntryMedia,
} from "./components/thought-entry";
import { PhotoPicker } from "./components/photo-picker";
import { getSession } from "../lib/auth/session";
import { formatThoughtDate } from "../lib/dates/thoughts";
import { listFamiliesForHoomin } from "../lib/families/store";
import { listPetsForFamily } from "../lib/pets/store";
import { cleanThoughtText } from "../lib/pets/thought-text";
import type { DailyThought, PetSummary } from "../lib/pets/types";
import { buildSiteUrl } from "../lib/site-url";
import { createFamilyAction } from "./families/actions";
import {
  createJournalThoughtAction,
  generatePetImageAction,
  generateThoughtImageAction,
} from "./pets/actions";

function HomeThoughtEntry({
  pet,
  thought,
}: {
  pet: PetSummary;
  thought: DailyThought;
}) {
  const imageUrl = thought.imagePath ? `/files/${thought.imagePath}` : null;
  const thoughtText = cleanThoughtText(thought.text);
  const entryUrl = buildSiteUrl(`/share/${thought.publicShareToken}`);
  const mediaItems: TimelineEntryMedia[] = [
    thought.imagePath
      ? {
          alt: `${pet.name}'s generated thought`,
          cardUrl: `/share/${thought.publicShareToken}/card`,
          entryUrl,
          kind: "generated",
          src: imageUrl ?? "",
        }
      : null,
    ...thought.journalPhotos.map((photo, index) => ({
      alt: `${pet.name} journal photo ${index + 1}`,
      cardUrl: `/share/${thought.publicShareToken}/card?cover=${photo.id}`,
      entryUrl: buildSiteUrl(`/share/${thought.publicShareToken}?cover=${photo.id}`),
      kind: "journal" as const,
      src: `/files/${photo.imagePath}`,
    })),
  ].filter((item): item is TimelineEntryMedia => Boolean(item));
  const entry: TimelineEntry = {
    hasGeneratedImage: Boolean(thought.imagePath),
    imageGenerationStatus: thought.imageGenerationStatus,
    imageGenerationError: thought.imageGenerationError,
    journalText: thought.journalText,
    kind: thought.source,
    mediaItems,
    petName: pet.name,
    text: thoughtText,
  };
  const canRegeneratePicture =
    thought.imageGenerationStatus === "failed" ||
    (!thought.imagePath && thought.imageGenerationStatus === "not_started");

  return (
    <TimelineEntryCard
      entry={entry}
      regenerateControl={
        canRegeneratePicture ? (
          <form action={generateThoughtImageAction} className="inline-generation-form">
            <input name="thoughtId" type="hidden" value={thought.id} />
            <PendingSubmitButton
              className="share-link secondary-share-link"
              pendingLabel="Drawing..."
            >
              Try drawing again
            </PendingSubmitButton>
          </form>
        ) : null
      }
    />
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    tab?: string;
  }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const families = await listFamiliesForHoomin(session.hoominId);
  const family = families[0] ?? null;
  const pets = family
    ? await listPetsForFamily(family.id, session.hoominId)
    : [];
  const pet = pets[0] ?? null;
  const thought = pet?.todayThought ?? null;
  const todayThoughts = pet?.todayThoughts ?? [];
  const thoughtImageUrl = thought?.imagePath ? `/files/${thought.imagePath}` : null;
  const isThoughtImageInFlight =
    thought?.imageGenerationStatus === "in_progress" && !thoughtImageUrl;
  const oldThoughtReady = Boolean(thought?.text);
  const heading = pet
    ? pet.name
    : family
      ? "who's thinking today?"
      : "ready for tiny thoughts?";
  const { tab } = (await searchParams) ?? {};
  const activeTab = tab === "journal" ? "journal" : "thoughts";

  return (
    <main className="home-shell product-home-shell">
      <SessionHeader session={session} />
      <section className="thought-card product-home" aria-labelledby="home-heading">
        <div className="home-app-hero">
          <div>
            <p className="eyebrow">Dear Hoomin</p>
            <h1 id="home-heading">{heading}</h1>
          </div>
          {pet?.selectedAvatarPath ? (
            <div className="home-pet-badge">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={`${pet.name}'s avatar`} src={`/files/${pet.selectedAvatarPath}`} />
            </div>
          ) : null}
        </div>

        {family ? (
          <AppTabs
            activeTab="thoughts"
            familyHref={`/families/${family.id}`}
          />
        ) : null}

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
              <PendingSubmitButton pendingLabel="Making family...">
                Create family
              </PendingSubmitButton>
            </form>
          </>
        ) : !pet ? (
          <>
            <div className="placeholder-pet" aria-hidden="true">
              ?
            </div>
            <p className="supporting-copy">
              No furbaby here yet. Add one little face before the daily musings can
              begin.
            </p>
            <a className="primary-link" href={`/families/${family.id}?addPet=1`}>
              Add furbaby
            </a>
          </>
        ) : !pet.selectedAvatarPath ? (
          <AvatarChooser pet={pet} />
        ) : activeTab === "journal" ? (
          <section id="journal" className="journal-composer" aria-label="Add a journal">
            <form action={createJournalThoughtAction} className="journal-composer-form">
              <input name="familyId" type="hidden" value={family.id} />
              <label className="app-field pet-select-field">
                <span>Pet</span>
                <select name="petId" defaultValue={pet.id}>
                  {pets.map((availablePet) => (
                    <option key={availablePet.id} value={availablePet.id}>
                      {availablePet.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-field photo-field">
                <span>Photos</span>
                <PhotoPicker multiple name="photos" required />
              </label>
              <label className="app-field note-field">
                <span>Journal note</span>
                <textarea
                  maxLength={1000}
                  name="journalText"
                  placeholder={`what happened with ${pet.name} today?`}
                  required
                  rows={4}
                />
              </label>
              <PendingSubmitButton pendingLabel="Making journal...">
                Make a journal thought
              </PendingSubmitButton>
            </form>
          </section>
        ) : (
          <>
            <a
              aria-label="Add musing"
              className="musing-fab"
              href="/?tab=journal"
              title="Add musing"
            >
              +
            </a>
            {isThoughtImageInFlight ? (
              <div className="daily-visual loading-visual" aria-live="polite">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name}'s avatar`} src={`/files/${pet.selectedAvatarPath}`} />
                <div className="loading-pill">
                  <span className="loading-spinner" aria-hidden="true" />
                  Drawing today&apos;s picture
                </div>
              </div>
            ) : todayThoughts.length === 0 ? (
              <div id="thoughts" className="thought-empty-visual" aria-hidden="true">
                <span>soon</span>
              </div>
            ) : null}
            {todayThoughts.length > 0 ? (
              <div id="thoughts" className="today-thought-list" aria-label="Thoughts">
                {todayThoughts.map((todayThought) => (
                  <HomeThoughtEntry
                    key={todayThought.id}
                    pet={pet}
                    thought={todayThought}
                  />
                ))}
              </div>
            ) : (
              <>
                <p className="thought-date">{formatThoughtDate(thought?.localDate)}</p>
                <p className="pet-thought">
                  {thought?.text ?? `${pet.name} is still deciding what to tell the hoomin.`}
                </p>
              </>
            )}
            {isThoughtImageInFlight ? (
              <p className="admin-status">
                {pet.name} is thinking real hard. Old thoughts can stay cozy here.
              </p>
            ) : null}
            {!thoughtImageUrl && thought?.imageGenerationStatus !== "in_progress" ? (
              <form action={generatePetImageAction} className="stacked-form">
                <input name="familyId" type="hidden" value={family.id} />
                <input name="petId" type="hidden" value={pet.id} />
                <PendingSubmitButton pendingLabel="Drawing...">
                  Make today&apos;s musing
                </PendingSubmitButton>
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
