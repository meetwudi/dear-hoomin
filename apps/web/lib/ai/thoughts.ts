import { getOpenAIClient, openAITextModel } from "./client";
import { buildThoughtTextPrompt } from "./prompts";
import { openAIMetadata, type GenerationTraceMetadata } from "./tracing";

export async function generatePetThoughtText({
  petName,
  species,
  metadata,
}: {
  petName: string;
  species: string | null;
  metadata: GenerationTraceMetadata;
}) {
  if (process.env.APP_AI_ADAPTER === "mock") {
    void metadata;
    return `${petName} has completed a careful investigation of the snack zone.`;
  }

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: openAITextModel,
    input: buildThoughtTextPrompt({ petName, species }),
    metadata: openAIMetadata(metadata),
  });
  const text = response.output_text.trim();

  if (!text) {
    throw new Error("thought_text_generation_empty");
  }

  return text.slice(0, 200);
}
