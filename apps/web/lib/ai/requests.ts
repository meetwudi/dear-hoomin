import { getPool } from "../db/client";
import * as aiRequestSql from "../db/sql/ai-requests";
import type { GenerationTraceMetadata } from "./tracing";

export type AiRequestType = GenerationTraceMetadata["generationType"];
export type AiRequestProvider = "openai" | "mock";

type JsonRecord = Record<string, unknown>;

export type CreateAiRequestInput = {
  metadata: GenerationTraceMetadata;
  provider: AiRequestProvider;
  model: string;
  prompt: string | null;
  inputSummary?: JsonRecord;
};

export async function createAiRequest({
  metadata,
  provider,
  model,
  prompt,
  inputSummary = {},
}: CreateAiRequestInput) {
  const result = await getPool().query<{ id: string }>(
    aiRequestSql.createAiRequest,
    [
      metadata.familyId,
      metadata.petId,
      metadata.thoughtId ?? null,
      metadata.requestedByHoominId ?? null,
      metadata.generationType,
      provider,
      model,
      prompt?.slice(0, 8000) ?? null,
      JSON.stringify(inputSummary),
    ],
  );

  return result.rows[0].id;
}

export async function markAiRequestSucceeded({
  requestId,
  outputSummary = {},
  providerRequestId = null,
}: {
  requestId: string;
  outputSummary?: JsonRecord;
  providerRequestId?: string | null;
}) {
  await getPool().query(aiRequestSql.markAiRequestSucceeded, [
    requestId,
    JSON.stringify(outputSummary),
    providerRequestId?.slice(0, 240) ?? null,
  ]);
}

export async function markAiRequestFailed({
  requestId,
  error,
}: {
  requestId: string;
  error: string;
}) {
  await getPool().query(aiRequestSql.markAiRequestFailed, [
    requestId,
    error.slice(0, 1000),
  ]);
}

export async function recordAiRequest<T>({
  input,
  run,
}: {
  input: CreateAiRequestInput;
  run: (requestId: string) => Promise<T>;
}) {
  const requestId = await createAiRequest(input);

  try {
    const output = await run(requestId);
    return output;
  } catch (error) {
    await markAiRequestFailed({
      requestId,
      error: error instanceof Error ? error.message : "ai_request_failed",
    });
    throw error;
  }
}
