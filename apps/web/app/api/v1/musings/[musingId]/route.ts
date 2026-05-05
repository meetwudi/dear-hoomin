import { apiHandler, requireApiContext } from "../../../../../lib/client-api/http";
import { deleteJournalMusingCapability } from "../../../../../lib/client-api/pets";

type MusingRouteProps = {
  params: Promise<{
    musingId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: MusingRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { musingId } = await params;

    return deleteJournalMusingCapability(context, musingId);
  });
}
