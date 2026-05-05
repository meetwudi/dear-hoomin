import { apiHandler, requireApiContext } from "../../../../../../../../lib/client-api/http";
import { choosePetAvatarCapability } from "../../../../../../../../lib/client-api/pets";

type AvatarCandidateSelectionRouteProps = {
  params: Promise<{
    petId: string;
    candidateId: string;
  }>;
};

export async function PUT(
  _request: Request,
  { params }: AvatarCandidateSelectionRouteProps,
) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { petId, candidateId } = await params;

    return choosePetAvatarCapability(context, {
      petId,
      candidateId,
    });
  });
}
