import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "../../../lib/auth/session";
import { getFamilyForHoomin } from "../../../lib/families/store";
import { isAdminSession } from "../../../lib/permissions";
import { downloadAppObject } from "../../../lib/storage";

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

  const canReadSystemFile = familyId === "system" && isAdminSession(session);
  const family = canReadSystemFile
    ? { id: "system" }
    : await getFamilyForHoomin(familyId, session.hoominId);

  if (!family) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storedObject = await downloadAppObject(path.join("/"));

  if (!storedObject) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(storedObject.bytes), {
    headers: {
      "cache-control": "private, max-age=300",
      "content-type": storedObject.contentType,
    },
  });
}
