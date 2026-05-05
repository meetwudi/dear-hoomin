import { apiHandler, requireApiContext } from "../../../../../../lib/client-api/http";
import { generateDailyMusingImageCapability } from "../../../../../../lib/client-api/pets";

type DailyMusingImageRouteProps = {
  params: Promise<{
    petId: string;
  }>;
};

export async function POST(_request: Request, { params }: DailyMusingImageRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { petId } = await params;

    return generateDailyMusingImageCapability(context, petId);
  });
}
