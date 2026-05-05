import {
  apiHandler,
  parseJsonObject,
  requireApiContext,
  requireString,
} from "../../../../lib/client-api/http";
import {
  createFamilyCapability,
  listFamiliesCapability,
} from "../../../../lib/client-api/families";

export async function GET() {
  return apiHandler(async () => {
    const context = await requireApiContext();

    return listFamiliesCapability(context);
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const body = await parseJsonObject(request);

    return createFamilyCapability(context, {
      name: requireString(body, "name"),
    });
  });
}
