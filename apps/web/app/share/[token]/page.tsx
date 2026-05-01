import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  getPublicThought,
  recordPublicThoughtView,
} from "../../../lib/public-thoughts/store";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

function formatThoughtDate(localDate: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${localDate}T00:00:00.000Z`));
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
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
      </section>
    </main>
  );
}
