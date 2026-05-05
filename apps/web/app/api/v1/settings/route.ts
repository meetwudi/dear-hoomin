import {
  apiHandler,
  optionalString,
  parseJsonObject,
  requireApiContext,
} from "../../../../lib/client-api/http";
import {
  getSettingsCapability,
  updateSettingsCapability,
} from "../../../../lib/client-api/settings";

export async function GET() {
  return apiHandler(async () => {
    const context = await requireApiContext();

    return getSettingsCapability(context);
  });
}

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    const context = await requireApiContext();
    const body = await parseJsonObject(request);
    const timeZone = optionalString(body, "timeZone");
    const thoughtGenerationInstructions = optionalString(
      body,
      "thoughtGenerationInstructions",
    );

    return updateSettingsCapability(context, {
      ...(timeZone !== null ? { timeZone } : {}),
      ...(body.thoughtGenerationInstructions !== undefined
        ? { thoughtGenerationInstructions }
        : {}),
    });
  });
}
