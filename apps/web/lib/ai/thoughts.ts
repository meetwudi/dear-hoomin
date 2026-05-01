import { getOpenAIClient, openAITextModel } from "./client";
import { buildThoughtTextPrompt } from "./prompts";
import { openAIMetadata, type GenerationTraceMetadata } from "./tracing";
import { cleanThoughtText } from "../pets/thought-text";

export async function generatePetThoughtText({
  petName,
  species,
  journalText,
  referenceImage,
  recentThoughts = [],
  extraInstructions,
  metadata,
}: {
  petName: string;
  species: string | null;
  journalText?: string | null;
  referenceImage?: { bytes: Buffer; contentType: string } | null;
  recentThoughts?: string[];
  extraInstructions?: string | null;
  metadata: GenerationTraceMetadata;
}) {
  if (process.env.APP_AI_ADAPTER === "mock") {
    void metadata;
    void referenceImage;
    return journalText
      ? `${petName} reviewed the evidence and has one tiny conclusion.`
      : `${petName} has completed a careful investigation of the snack zone.`;
  }

  const openai = getOpenAIClient();
  const prompt = buildThoughtTextPrompt({
    petName,
    species,
    journalText,
    recentThoughts,
    extraInstructions,
  });
  const input = referenceImage
    ? [
        {
          role: "user" as const,
          content: [
            { type: "input_text" as const, text: prompt },
            {
              type: "input_image" as const,
              image_url: `data:${referenceImage.contentType};base64,${referenceImage.bytes.toString("base64")}`,
              detail: "low" as const,
            },
          ],
        },
      ]
    : prompt;
  const response = await openai.responses.create({
    model: openAITextModel,
    input,
    metadata: openAIMetadata(metadata),
  });
  const text = cleanThoughtText(response.output_text);

  if (!text) {
    throw new Error("thought_text_generation_empty");
  }

  return text.slice(0, 200);
}
