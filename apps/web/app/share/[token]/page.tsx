import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  TimelineEntryCard,
  type TimelineEntry,
  type TimelineEntryMedia,
} from "../../components/thought-entry";
import { formatThoughtDate } from "../../../lib/dates/thoughts";
import { cleanThoughtText } from "../../../lib/pets/thought-text";
import {
  getPublicThought,
  recordPublicThoughtView,
} from "../../../lib/public-thoughts/store";
import { buildSiteUrl } from "../../../lib/site-url";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    cover?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const { cover } = (await searchParams) ?? {};
  const thought = await getPublicThought(token);

  if (!thought) {
    return {};
  }

  const title = `what's ${thought.petName} thinking?`;
  const selectedCover = thought.journalPhotos.some((photo) => photo.id === cover)
    ? cover
    : null;
  const coverQuery = selectedCover ? `?cover=${selectedCover}` : "";
  const cardUrl = buildSiteUrl(`/share/${token}/card${coverQuery}`);
  const shareUrl = buildSiteUrl(`/share/${token}${coverQuery}`);

  return {
    title,
    description: thought.text,
    openGraph: {
      title,
      description: thought.text,
      images: [{ url: cardUrl, width: 1080, height: 1430 }],
      url: shareUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: thought.text,
      images: [cardUrl],
    },
  };
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const { token } = await params;
  const { cover } = (await searchParams) ?? {};
  const thought = await getPublicThought(token);

  if (!thought) {
    notFound();
  }

  const requestHeaders = await headers();
  await recordPublicThoughtView({
    shareToken: token,
    referrer: requestHeaders.get("referer"),
    userAgent: requestHeaders.get("user-agent"),
  });

  const mediaItems: TimelineEntryMedia[] = [
    thought.imagePath
      ? {
          alt: `${thought.petName}'s generated thought`,
          cardUrl: `/share/${token}/card`,
          entryUrl: buildSiteUrl(`/share/${token}`),
          kind: "generated",
          src: `/share/${token}/image`,
        }
      : null,
    ...thought.journalPhotos.map((photo, index) => ({
      alt: `${thought.petName} journal photo ${index + 1}`,
      cardUrl: `/share/${token}/card?cover=${photo.id}`,
      entryUrl: buildSiteUrl(`/share/${token}?cover=${photo.id}`),
      kind: "journal" as const,
      src: `/share/${token}/image?cover=${photo.id}`,
    })),
  ].filter((item): item is TimelineEntryMedia => Boolean(item));
  const selectedMediaIndex = Math.max(
    0,
    mediaItems.findIndex((item) => cover && item.entryUrl.endsWith(`?cover=${cover}`)),
  );
  const thoughtText = cleanThoughtText(thought.text);
  const entry: TimelineEntry = {
    hasGeneratedImage: Boolean(thought.imagePath),
    imageGenerationStatus: thought.imageGenerationStatus,
    imageGenerationError: null,
    journalText: thought.journalText,
    kind: thought.source,
    mediaItems,
    petName: thought.petName,
    text: thoughtText,
  };

  return (
    <main className="home-shell product-home-shell public-share-shell">
      <section className="thought-card product-home public-share-panel" aria-labelledby="share-heading">
        <div className="home-app-hero public-share-hero">
          <div>
            <p className="eyebrow">Dear Hoomin</p>
            <h1 id="share-heading">{thought.petName}</h1>
            <p className="thought-date">{formatThoughtDate(thought.localDate)}</p>
          </div>
        </div>
        <div className="today-thought-list public-share-entry-list">
          <TimelineEntryCard
            entry={entry}
            initialMediaIndex={selectedMediaIndex}
            showShareActions={false}
          />
        </div>
      </section>
    </main>
  );
}
