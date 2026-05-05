import { apiHandler, requireApiContext } from "../../../../../lib/client-api/http";
import { getFamilyCapability } from "../../../../../lib/client-api/families";

type FamilyRouteProps = {
  params: Promise<{
    familyId: string;
  }>;
};

export async function GET(_request: Request, { params }: FamilyRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { familyId } = await params;

    return getFamilyCapability(context, familyId);
  });
}
