import { NextResponse } from "next/server";
import { getSession, type AuthSession } from "../auth/session";

export type ApiContext = {
  session: AuthSession;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireApiContext(): Promise<ApiContext> {
  const session = await getSession();

  if (!session) {
    throw new ApiRequestError("unauthorized", 401);
  }

  return { session };
}

export async function parseJsonObject(request: Request) {
  const input = (await request.json()) as unknown;

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiRequestError("json_object_required");
  }

  return input as Record<string, unknown>;
}

export function requireString(input: Record<string, unknown>, key: string) {
  const value = input[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new ApiRequestError(`${key}_required`);
  }

  return value.trim();
}

export function optionalString(input: Record<string, unknown>, key: string) {
  const value = input[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiRequestError(`${key}_invalid`);
  }

  return value.trim() || null;
}

export function optionalBoolean(input: Record<string, unknown>, key: string) {
  const value = input[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "boolean") {
    throw new ApiRequestError(`${key}_invalid`);
  }

  return value;
}

export function apiErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "request_failed";

  if (error instanceof ApiRequestError) {
    return NextResponse.json({ error: message }, { status: error.status });
  }

  const statusByMessage: Record<string, number> = {
    avatar_candidate_not_found: 404,
    avatar_generation_in_progress: 409,
    avatar_subject_forbidden: 403,
    daily_musing_image_generation_failed: 502,
    family_not_found: 404,
    family_owner_required: 403,
    hoomin_not_found: 404,
    invite_not_found: 404,
    pet_not_found: 404,
    thought_not_found: 404,
    thought_image_generation_failed: 502,
  };

  return NextResponse.json(
    { error: message },
    { status: statusByMessage[message] ?? 400 },
  );
}

export async function apiHandler<T>(handler: () => Promise<T>) {
  try {
    return NextResponse.json(await handler());
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export function requireFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new ApiRequestError(`${key}_required`);
  }

  return value.trim();
}

export function requireFormFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    throw new ApiRequestError(`${key}_required`);
  }

  return value;
}
