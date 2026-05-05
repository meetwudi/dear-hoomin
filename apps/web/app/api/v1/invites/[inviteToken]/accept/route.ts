import { apiHandler, requireApiContext } from "../../../../../../lib/client-api/http";
import { acceptFamilyInviteCapability } from "../../../../../../lib/client-api/families";

type InviteAcceptRouteProps = {
  params: Promise<{
    inviteToken: string;
  }>;
};

export async function POST(_request: Request, { params }: InviteAcceptRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { inviteToken } = await params;

    return acceptFamilyInviteCapability(context, inviteToken);
  });
}
