import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { formatThoughtDate } from "../../../../lib/dates/thoughts";
import { cleanThoughtText } from "../../../../lib/pets/thought-text";
import { getPublicThought } from "../../../../lib/public-thoughts/store";
import { productCopy } from "../../../../lib/product-copy";

type ShareCardRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

function getThoughtTextSize(text: string) {
  const length = Array.from(text).length;

  if (length <= 80) {
    return 54;
  }

  if (length <= 130) {
    return 48;
  }

  if (length <= 190) {
    return 40;
  }

  return 34;
}

export async function GET(request: Request, { params }: ShareCardRouteProps) {
  const { token } = await params;
  const thought = await getPublicThought(token);
  const requestUrl = new URL(request.url);
  const coverFileId = requestUrl.searchParams.get("cover");

  if (!thought || (!thought.imagePath && !coverFileId)) {
    notFound();
  }

  const imageUrl = new URL(`/share/${token}/image`, request.url);

  if (coverFileId) {
    imageUrl.searchParams.set("cover", coverFileId);
  }

  const thoughtText = cleanThoughtText(thought.text);
  const thoughtTextSize = getThoughtTextSize(thoughtText);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "70px 70px 110px",
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
            border: "4px solid #eadfce",
            borderRadius: 28,
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={productCopy.media.thoughtImageAlt(thought.petName)}
            src={imageUrl.toString()}
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
              padding: "38px 46px 74px",
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
              <span>{productCopy.brand.name}</span>
              <span>{formatThoughtDate(thought.localDate)}</span>
            </div>
            <div
              style={{
                display: "flex",
                color: "#2c2416",
                fontSize: thoughtTextSize,
                fontWeight: 800,
                lineHeight: 1.12,
                overflowWrap: "break-word",
              }}
            >
              {thoughtText}
            </div>
            <div
              style={{
                display: "flex",
                color: "#6f614d",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {productCopy.share.text(thought.petName)}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1430,
      headers: {
        "cache-control": "public, max-age=300",
      },
    },
  );
}
