import { NextResponse, type NextRequest } from "next/server";
import { getPublicThoughtCoverImage } from "../../../../lib/public-thoughts/store";
import { downloadAppObject } from "../../../../lib/storage";

type ShareImageRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(request: NextRequest, { params }: ShareImageRouteProps) {
  const { token } = await params;
  const coverFileId = request.nextUrl.searchParams.get("cover");
  const coverImage = await getPublicThoughtCoverImage({
    shareToken: token,
    coverFileId,
  });

  if (!coverImage) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storedObject = await downloadAppObject(coverImage.object_key);

  if (!storedObject) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(storedObject.bytes), {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": storedObject.contentType,
    },
  });
}
