import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareThoughtButton } from "../../components/share-thought-button";
import { formatThoughtDate } from "../../../lib/dates/thoughts";
import { getRequestOrigin } from "../../../lib/http/origin";
import {
  getPublicThought,
  recordPublicThoughtView,
} from "../../../lib/public-thoughts/store";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const thought = await getPublicThought(token);

  if (!thought) {
    return {};
  }

  const origin = await getRequestOrigin();
  const title = `what's ${thought.petName} thinking?`;
  const cardUrl = `${origin}/share/${token}/card`;
  const shareUrl = `${origin}/share/${token}`;

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

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const [thought, origin] = await Promise.all([
    getPublicThought(token),
    getRequestOrigin(),
  ]);

  if (!thought) {
    notFound();
  }

  const requestHeaders = await headers();
  await recordPublicThoughtView({
    shareToken: token,
    referrer: requestHeaders.get("referer"),
    userAgent: requestHeaders.get("user-agent"),
  });

  return (
    <main className="home-shell public-share-shell">
      <section className="thought-card" aria-labelledby="share-heading">
        <p className="eyebrow">Dear Hoomin</p>
        <h1 id="share-heading">what&apos;s {thought.petName} thinking?</h1>
        <p className="thought-date">{formatThoughtDate(thought.localDate)}</p>
        {thought.imagePath ? (
          <div className="daily-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={`${thought.petName}'s thought`} src={`/share/${token}/image`} />
          </div>
        ) : null}
        <p className="pet-thought">{thought.text}</p>
        {thought.imagePath ? (
          <ShareThoughtButton
            cardUrl={`/share/${token}/card`}
            petName={thought.petName}
            shareUrl={`${origin}/share/${token}`}
          />
        ) : null}
      </section>
    </main>
  );
}
