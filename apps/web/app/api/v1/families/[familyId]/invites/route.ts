import { apiHandler, requireApiContext } from "../../../../../../lib/client-api/http";
import { createFamilyInviteCapability } from "../../../../../../lib/client-api/families";

type FamilyInvitesRouteProps = {
  params: Promise<{
    familyId: string;
  }>;
};

export async function POST(_request: Request, { params }: FamilyInvitesRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { familyId } = await params;

    return createFamilyInviteCapability(context, familyId);
  });
}
