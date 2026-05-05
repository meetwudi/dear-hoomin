import { redirect } from "next/navigation";
import { SessionHeader } from "./components/session-header";
import { AppTabs } from "./components/app-tabs";
import { AvatarChooser } from "./components/avatar-chooser";
import { JournalComposer } from "./components/journal-composer";
import { PendingSubmitButton } from "./components/pending-submit-button";
import {
  TimelineEntryCard,
  type TimelineEntry,
  type TimelineEntryMedia,
} from "./components/thought-entry";
import { getSession } from "../lib/auth/session";
import { formatThoughtDate } from "../lib/dates/thoughts";
import { listFamiliesForHoomin } from "../lib/families/store";
import { listPetsForFamily } from "../lib/pets/store";
import { cleanThoughtText } from "../lib/pets/thought-text";
import type { DailyThought, PetSummary } from "../lib/pets/types";
import { productCopy } from "../lib/product-copy";
import { buildSiteUrl } from "../lib/site-url";
import { createFamilyAction } from "./families/actions";
import {
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
          alt: productCopy.media.generatedMusingAlt(pet.name),
          cardUrl: `/share/${thought.publicShareToken}/card`,
          entryUrl,
          kind: "generated",
          src: imageUrl ?? "",
        }
      : null,
    ...thought.journalPhotos.map((photo, index) => ({
      alt: productCopy.media.journalPhotoAlt(pet.name, index),
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
    musingId: thought.id,
    petName: pet.name,
    postedAt: thought.createdAt,
    postedAtLabel: formatPostedTime(thought.createdAt),
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
              pendingLabel={productCopy.home.musings.drawingButton}
            >
              {productCopy.home.musings.tryDrawingAgainButton}
            </PendingSubmitButton>
          </form>
        ) : null
      }
      showDeleteAction={thought.source === "journal"}
    />
  );
}

function formatPostedTime(postedAt: string) {
  if (!postedAt) {
    return productCopy.timeline.postedFallback;
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(postedAt));
}

export default async function Home() {
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
      ? productCopy.home.headings.noPet
      : productCopy.home.headings.noFamily;
  return (
    <main className="home-shell product-home-shell">
      <SessionHeader session={session} />
      <section className="thought-card product-home" aria-labelledby="home-heading">
        <div className="home-app-hero">
          <div>
            <p className="eyebrow">{productCopy.home.eyebrow}</p>
            <h1 id="home-heading">{heading}</h1>
          </div>
          {pet?.selectedAvatarPath ? (
            <div className="home-pet-badge">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={productCopy.media.avatarAlt(pet.name)}
                src={`/files/${pet.selectedAvatarPath}`}
              />
            </div>
          ) : null}
        </div>

        {family ? (
          <AppTabs
            activeTab="musings"
            familyHref={`/families/${family.id}`}
          />
        ) : null}

        {!family ? (
          <>
            <p className="supporting-copy">
              {productCopy.home.family.intro}
            </p>
            <form action={createFamilyAction} className="stacked-form">
              <label>
                {productCopy.home.family.nameLabel}
                <input
                  maxLength={100}
                  name="name"
                  placeholder={productCopy.home.family.namePlaceholder}
                  required
                />
              </label>
              <PendingSubmitButton pendingLabel={productCopy.home.family.creatingButton}>
                {productCopy.home.family.createButton}
              </PendingSubmitButton>
            </form>
          </>
        ) : !pet ? (
          <>
            <div className="placeholder-pet" aria-hidden="true">
              {productCopy.home.noPet.visual}
            </div>
            <p className="supporting-copy">
              {productCopy.home.noPet.intro}
            </p>
            <a className="primary-link" href={`/families/${family.id}?addPet=1`}>
              {productCopy.home.noPet.addPetLink}
            </a>
          </>
        ) : !pet.selectedAvatarPath ? (
          <AvatarChooser pet={pet} />
        ) : (
          <>
            <JournalComposer
              defaultPetId={pet.id}
              familyId={family.id}
              pets={pets.map((availablePet) => ({
                id: availablePet.id,
                name: availablePet.name,
              }))}
            />
            {isThoughtImageInFlight ? (
              <div className="daily-visual loading-visual" aria-live="polite">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={productCopy.media.avatarAlt(pet.name)}
                  src={`/files/${pet.selectedAvatarPath}`}
                />
                <div className="loading-pill">
                  <span className="loading-spinner" aria-hidden="true" />
                  {productCopy.home.musings.drawingTodayPicture}
                </div>
              </div>
            ) : todayThoughts.length === 0 ? (
              <div id="musings" className="thought-empty-visual" aria-hidden="true">
                <span>{productCopy.home.musings.emptyVisual}</span>
              </div>
            ) : null}
            {todayThoughts.length > 0 ? (
              <div
                id="musings"
                className="today-thought-list"
                aria-label={productCopy.home.musings.listLabel}
              >
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
                  {thought?.text ?? productCopy.home.musings.fallbackMusing(pet.name)}
                </p>
              </>
            )}
            {isThoughtImageInFlight ? (
              <p className="admin-status">
                {productCopy.home.musings.inFlightStatus(pet.name)}
              </p>
            ) : null}
            {!thoughtImageUrl && thought?.imageGenerationStatus !== "in_progress" ? (
              <form action={generatePetImageAction} className="stacked-form">
                <input name="familyId" type="hidden" value={family.id} />
                <input name="petId" type="hidden" value={pet.id} />
                <PendingSubmitButton pendingLabel={productCopy.home.musings.drawingButton}>
                  {productCopy.home.musings.makeMusingButton}
                </PendingSubmitButton>
              </form>
            ) : null}
            {!oldThoughtReady ? (
              <p className="admin-status">
                {productCopy.home.musings.firstDoodleStatus}
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
