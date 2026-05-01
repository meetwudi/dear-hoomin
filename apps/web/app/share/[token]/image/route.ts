import { NextResponse, type NextRequest } from "next/server";
import { getPublicThought } from "../../../../lib/public-thoughts/store";
import { downloadAppFile } from "../../../../lib/storage/supabase-storage";

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

  const storedFile = await downloadAppFile(thought.imagePath);

  if (!storedFile) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(storedFile.bytes, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": storedFile.contentType,
    },
  });
}
