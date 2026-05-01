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

function mockImage({ label, fill }: { label: string; fill: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${fill}"/><circle cx="512" cy="420" r="210" fill="#fff8ed"/><circle cx="430" cy="385" r="28" fill="#2c2416"/><circle cx="594" cy="385" r="28" fill="#2c2416"/><path d="M420 540c54 58 130 58 184 0" fill="none" stroke="#2c2416" stroke-width="28" stroke-linecap="round"/><text x="512" y="820" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#2c2416">${label}</text></svg>`;

  return Buffer.from(svg);
}

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

  if (process.env.APP_AI_ADAPTER === "mock") {
    return {
      bytes: mockImage({
        label: `avatar ${variant}`,
        fill: variant === 1 ? "#f7c86f" : variant === 2 ? "#9cc9b8" : "#f2a0a1",
      }),
      contentType: "image/svg+xml",
      prompt: buildAvatarCandidatePrompt({
        petName,
        species,
        instructions,
        variant,
      }),
    };
  }

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

  if (process.env.APP_AI_ADAPTER === "mock") {
    return {
      bytes: mockImage({ label: "tiny thought", fill: "#b8d7f1" }),
      contentType: "image/svg+xml",
      prompt: buildThoughtImagePrompt({ petName, species, thoughtText }),
    };
  }

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
