import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth/session";
import {
  parseAvatarSubjectType,
  uploadAvatarReferencePhoto,
} from "../../../../lib/avatar-identities/store";
import { isAcceptedUploadImage } from "../../../../lib/uploads/images";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key}_required`);
  }

  return value.trim();
}

function requirePhoto(formData: FormData) {
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("photo_required");
  }

  if (!isAcceptedUploadImage(photo)) {
    throw new Error("photo_type_invalid");
  }

  return photo;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const familyId = requireString(formData, "familyId");
    const subjectType = parseAvatarSubjectType(
      requireString(formData, "subjectType"),
    );
    const subjectId = requireString(formData, "subjectId");
    const displayName = requireString(formData, "displayName").slice(0, 120);
    const avatarIdentityId = await uploadAvatarReferencePhoto({
      familyId,
      subjectType,
      subjectId,
      displayName,
      hoominId: session.hoominId,
      photo: requirePhoto(formData),
    });

    return NextResponse.json({ avatarIdentityId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "upload_failed";
    const status =
      message === "family_not_found" || message === "avatar_subject_forbidden"
        ? 403
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
