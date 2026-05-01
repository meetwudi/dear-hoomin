import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "../../../lib/auth/session";
import { getFamilyForHoomin } from "../../../lib/families/store";
import { downloadAppFile } from "../../../lib/storage/supabase-storage";

type FileRouteProps = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(_request: NextRequest, { params }: FileRouteProps) {
  const session = await getSession();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { path } = await params;
  const familyId = path[0];

  if (!familyId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const family = await getFamilyForHoomin(familyId, session.hoominId);

  if (!family) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storedFile = await downloadAppFile(path.join("/"));

  if (!storedFile) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(storedFile.bytes, {
    headers: {
      "cache-control": "private, max-age=300",
      "content-type": storedFile.contentType,
    },
  });
}
