import { getOpenAIClient, openAITextModel } from "./client";
import { buildThoughtTextPrompt } from "./prompts";
import {
  markAiRequestSucceeded,
  recordAiRequest,
} from "./requests";
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
  const prompt = buildThoughtTextPrompt({
    petName,
    species,
    journalText,
    recentThoughts,
    extraInstructions,
  });

  if (process.env.APP_AI_ADAPTER === "mock") {
    return recordAiRequest({
      input: {
        metadata,
        provider: "mock",
        model: "mock-text",
        prompt,
        inputSummary: {
          hasReferenceImage: Boolean(referenceImage),
          recentThoughtCount: recentThoughts.length,
        },
      },
      run: async (requestId) => {
        const text = journalText
          ? `${petName} reviewed the evidence and has one tiny conclusion.`
          : `${petName} has completed a careful investigation of the snack zone.`;

        await markAiRequestSucceeded({
          requestId,
          outputSummary: {
            characterCount: text.length,
          },
        });

        return text;
      },
    });
  }

  const openai = getOpenAIClient();
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
  return recordAiRequest({
    input: {
      metadata,
      provider: "openai",
      model: openAITextModel,
      prompt,
      inputSummary: {
        hasReferenceImage: Boolean(referenceImage),
        recentThoughtCount: recentThoughts.length,
      },
    },
    run: async (requestId) => {
      const response = await openai.responses.create({
        model: openAITextModel,
        input,
        metadata: openAIMetadata(metadata),
      });
      const text = cleanThoughtText(response.output_text);

      if (!text) {
        throw new Error("thought_text_generation_empty");
      }

      const truncatedText = text.slice(0, 200);

      await markAiRequestSucceeded({
        requestId,
        outputSummary: {
          characterCount: truncatedText.length,
        },
        providerRequestId: response.id,
      });

      return truncatedText;
    },
  });
}
