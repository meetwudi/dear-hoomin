import { toFile } from "openai";
import type { Images } from "openai/resources/images";
import {
  getOpenAIClient,
  openAIImageModel,
  openAIImageSize,
} from "./client";
import {
  buildAvatarCandidatePrompt,
  buildThoughtImagePrompt,
} from "./prompts";
import type { GenerationTraceMetadata } from "./tracing";

export async function generateAvatarCandidateImage({
  petReference,
  baseStyle,
  petName,
  species,
  instructions,
  variant,
  metadata,
}: {
  petReference: { bytes: Buffer; contentType: string };
  baseStyle: { bytes: Buffer; contentType: string };
  petName: string;
  species: string | null;
  instructions: string | null;
  variant: number;
  metadata: GenerationTraceMetadata;
}) {
  void metadata;
  const openai = getOpenAIClient();
  const [referenceFile, styleFile] = await Promise.all([
    toFile(petReference.bytes, "pet-reference.jpg", {
      type: petReference.contentType,
    }),
    toFile(baseStyle.bytes, "base-avatar-style.png", {
      type: baseStyle.contentType,
    }),
  ]);
  const prompt = buildAvatarCandidatePrompt({
    petName,
    species,
    instructions,
    variant,
  });
  const request: Images.ImageEditParamsNonStreaming = {
    model: openAIImageModel,
    image: [referenceFile, styleFile],
    prompt,
    output_format: "png",
    size: openAIImageSize,
  };

  const result = await openai.images.edit(request);
  const generatedBase64 = result.data?.[0]?.b64_json;

  if (!generatedBase64) {
    throw new Error("avatar_generation_empty");
  }

  return {
    bytes: Buffer.from(generatedBase64, "base64"),
    contentType: "image/png",
    prompt,
  };
}

export async function generateDailyThoughtImageBytes({
  avatar,
  petName,
  species,
  thoughtText,
  metadata,
}: {
  avatar: { bytes: Buffer; contentType: string };
  petName: string;
  species: string | null;
  thoughtText: string;
  metadata: GenerationTraceMetadata;
}) {
  void metadata;
  const openai = getOpenAIClient();
  const image = await toFile(avatar.bytes, "selected-avatar.png", {
    type: avatar.contentType,
  });
  const prompt = buildThoughtImagePrompt({ petName, species, thoughtText });
  const request: Images.ImageEditParamsNonStreaming = {
    model: openAIImageModel,
    image,
    prompt,
    output_format: "png",
    size: openAIImageSize,
  };

  const result = await openai.images.edit(request);
  const generatedBase64 = result.data?.[0]?.b64_json;

  if (!generatedBase64) {
    throw new Error("image_generation_empty");
  }

  return {
    bytes: Buffer.from(generatedBase64, "base64"),
    contentType: "image/png",
    prompt,
  };
}
