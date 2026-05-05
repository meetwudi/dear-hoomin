import {
  apiHandler,
  requireApiContext,
  requireFormFile,
  requireFormString,
} from "../../../../../../lib/client-api/http";
import { createPetCapability } from "../../../../../../lib/client-api/pets";

type FamilyPetsRouteProps = {
  params: Promise<{
    familyId: string;
  }>;
};

export async function POST(request: Request, { params }: FamilyPetsRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { familyId } = await params;
    const formData = await request.formData();

    return createPetCapability(context, {
      familyId,
      name: requireFormString(formData, "name"),
      photo: requireFormFile(formData, "photo"),
    });
  });
}
