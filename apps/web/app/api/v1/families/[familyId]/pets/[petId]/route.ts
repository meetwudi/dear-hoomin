import {
  apiHandler,
  optionalString,
  parseJsonObject,
  requireApiContext,
  requireString,
} from "../../../../../../../lib/client-api/http";
import { updateFurbabyDetailsCapability } from "../../../../../../../lib/client-api/pets";

type FamilyPetRouteProps = {
  params: Promise<{
    familyId: string;
    petId: string;
  }>;
};

export async function PATCH(request: Request, { params }: FamilyPetRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { familyId, petId } = await params;
    const body = await parseJsonObject(request);

    return updateFurbabyDetailsCapability(context, {
      familyId,
      petId,
      name: requireString(body, "name"),
      instructions: optionalString(body, "instructions"),
    });
  });
}
