import {
  apiHandler,
  optionalBoolean,
  parseJsonObject,
  requireApiContext,
} from "../../../../lib/client-api/http";
import { updateNotificationPreferencesCapability } from "../../../../lib/client-api/settings";

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const body = await parseJsonObject(request);

    return updateNotificationPreferencesCapability(context, {
      allEnabled: optionalBoolean(body, "allEnabled") ?? undefined,
      thoughtPublishedEnabled:
        optionalBoolean(body, "thoughtPublishedEnabled") ?? undefined,
    });
  });
}
