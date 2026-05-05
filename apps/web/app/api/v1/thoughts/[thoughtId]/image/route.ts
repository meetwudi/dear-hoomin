import { apiHandler, requireApiContext } from "../../../../../../lib/client-api/http";
import { generateThoughtImageCapability } from "../../../../../../lib/client-api/pets";

type ThoughtImageRouteProps = {
  params: Promise<{
    thoughtId: string;
  }>;
};

export async function POST(_request: Request, { params }: ThoughtImageRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { thoughtId } = await params;

    return generateThoughtImageCapability(context, thoughtId);
  });
}
