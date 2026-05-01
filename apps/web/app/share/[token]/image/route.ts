import { NextResponse, type NextRequest } from "next/server";
import { getPublicThought } from "../../../../lib/public-thoughts/store";
import { downloadAppObject } from "../../../../lib/storage";

type ShareImageRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: ShareImageRouteProps) {
  const { token } = await params;
  const thought = await getPublicThought(token);

  if (!thought?.imagePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storedObject = await downloadAppObject(thought.imagePath);

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
