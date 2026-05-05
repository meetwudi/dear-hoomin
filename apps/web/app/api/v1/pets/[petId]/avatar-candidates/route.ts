import {
  apiHandler,
  optionalString,
  parseJsonObject,
  requireApiContext,
} from "../../../../../../lib/client-api/http";
import { generatePetAvatarCandidatesCapability } from "../../../../../../lib/client-api/pets";

type PetAvatarCandidatesRouteProps = {
  params: Promise<{
    petId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: PetAvatarCandidatesRouteProps,
) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { petId } = await params;
    const body = await parseJsonObject(request);

    return generatePetAvatarCandidatesCapability(context, {
      petId,
      instructions: optionalString(body, "instructions"),
    });
  });
}
