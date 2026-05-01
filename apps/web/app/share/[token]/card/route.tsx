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

export async function GET(request: Request, { params }: ShareCardRouteProps) {
  const { token } = await params;
  const thought = await getPublicThought(token);

  if (!thought?.imagePath) {
    notFound();
  }

  const imageUrl = new URL(`/share/${token}/image`, request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 70,
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
              height: 820,
              objectFit: "cover",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              padding: "38px 46px",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 24,
                color: "#8b4d21",
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              <span>Dear Hoomin</span>
              <span>{formatThoughtDate(thought.localDate)}</span>
            </div>
            <div
              style={{
                display: "flex",
                color: "#2c2416",
                fontSize: 54,
                fontWeight: 800,
                lineHeight: 1.12,
              }}
            >
              {thought.text}
            </div>
            <div
              style={{
                display: "flex",
                color: "#6f614d",
                fontSize: 28,
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
      height: 1350,
      headers: {
        "cache-control": "public, max-age=300",
      },
    },
  );
}
