import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPublicThought } from "../../../../lib/public-thoughts/store";

type ShareCardRouteProps = {
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

function getThoughtTextSize(text: string) {
  const length = Array.from(text).length;

  if (length <= 80) {
    return 50;
  }

  if (length <= 130) {
    return 43;
  }

  if (length <= 190) {
    return 36;
  }

  return 31;
}

function getThoughtImageHeight(text: string) {
  const length = Array.from(text).length;

  if (length <= 80) {
    return 900;
  }

  if (length <= 130) {
    return 860;
  }

  if (length <= 190) {
    return 820;
  }

  return 780;
}

export async function GET(request: Request, { params }: ShareCardRouteProps) {
  const { token } = await params;
  const thought = await getPublicThought(token);

  if (!thought?.imagePath) {
    notFound();
  }

  const imageUrl = new URL(`/share/${token}/image`, request.url).toString();
  const thoughtTextSize = getThoughtTextSize(thought.text);
  const thoughtImageHeight = getThoughtImageHeight(thought.text);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "60px 56px 180px",
          background: "#fff8ed",
          color: "#2c2416",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            border: "4px solid #eadfce",
            borderRadius: 28,
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`${thought.petName}'s thought`}
            src={imageUrl}
            style={{
              width: "100%",
              height: thoughtImageHeight,
              objectFit: "cover",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 18,
              padding: "36px 46px 56px",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 24,
                color: "#8b4d21",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              <span>Dear Hoomin</span>
              <span>{formatThoughtDate(thought.localDate)}</span>
            </div>
            <div
              style={{
                display: "flex",
                flex: 1,
                color: "#2c2416",
                fontSize: thoughtTextSize,
                fontWeight: 800,
                lineHeight: 1.14,
                overflowWrap: "break-word",
              }}
            >
              {thought.text}
            </div>
            <div
              style={{
                display: "flex",
                color: "#6f614d",
                fontSize: 25,
                fontWeight: 700,
              }}
            >
              what&apos;s {thought.petName} thinking?
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        "cache-control": "public, max-age=300",
      },
    },
  );
}
