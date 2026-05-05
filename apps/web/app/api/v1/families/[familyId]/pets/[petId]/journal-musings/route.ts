import {
  apiHandler,
  requireApiContext,
  requireFormString,
} from "../../../../../../../../lib/client-api/http";
import { createJournalMusingCapability } from "../../../../../../../../lib/client-api/pets";

type JournalMusingsRouteProps = {
  params: Promise<{
    familyId: string;
    petId: string;
  }>;
};

export async function POST(request: Request, { params }: JournalMusingsRouteProps) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const { familyId, petId } = await params;
    const formData = await request.formData();
    const photos = formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    return createJournalMusingCapability(context, {
      familyId,
      petId,
      journalText: requireFormString(formData, "journalText"),
      photos,
    });
  });
}
