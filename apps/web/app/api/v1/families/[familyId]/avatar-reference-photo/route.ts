import { parseAvatarSubjectType } from "../../../../../../lib/avatar-identities/store";
import {
  apiHandler,
  requireApiContext,
  requireFormFile,
  requireFormString,
} from "../../../../../../lib/client-api/http";
import { uploadAvatarReferencePhotoCapability } from "../../../../../../lib/client-api/pets";

type AvatarReferencePhotoRouteProps = {
  params: Promise<{
    familyId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: AvatarReferencePhotoRouteProps,
) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { familyId } = await params;
    const formData = await request.formData();

    return uploadAvatarReferencePhotoCapability(context, {
      familyId,
      subjectType: parseAvatarSubjectType(
        requireFormString(formData, "subjectType"),
      ),
      subjectId: requireFormString(formData, "subjectId"),
      displayName: requireFormString(formData, "displayName"),
      photo: requireFormFile(formData, "photo"),
    });
  });
}
