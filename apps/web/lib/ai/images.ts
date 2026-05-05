import { toFile } from "openai";
import type { Images } from "openai/resources/images";
import sharp from "sharp";
import {
  getOpenAIClient,
  openAIImageModel,
  openAIImageSize,
} from "./client";
import {
  buildAvatarCandidatePrompt,
  buildThoughtImagePrompt,
} from "./prompts";
import {
  markAiRequestSucceeded,
  recordAiRequest,
} from "./requests";
import type { GenerationTraceMetadata } from "./tracing";

function mockImage({ label, fill }: { label: string; fill: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${fill}"/><circle cx="512" cy="420" r="210" fill="#fff8ed"/><circle cx="430" cy="385" r="28" fill="#2c2416"/><circle cx="594" cy="385" r="28" fill="#2c2416"/><path d="M420 540c54 58 130 58 184 0" fill="none" stroke="#2c2416" stroke-width="28" stroke-linecap="round"/><text x="512" y="820" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#2c2416">${label}</text></svg>`;

  return Buffer.from(svg);
}

async function prepareEditImage(
  image: { bytes: Buffer; contentType: string },
  format: "jpeg" | "png",
) {
  const pipeline = sharp(image.bytes).rotate();

  if (format === "jpeg") {
    return {
      bytes: await pipeline
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 92 })
        .toBuffer(),
      contentType: "image/jpeg",
    };
  }

  return {
    bytes: await pipeline.png().toBuffer(),
    contentType: "image/png",
  };
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
  const prompt = buildAvatarCandidatePrompt({
    petName,
    species,
    instructions,
    variant,
  });

  if (process.env.APP_AI_ADAPTER === "mock") {
    return recordAiRequest({
      input: {
        metadata,
        provider: "mock",
        model: "mock-image",
        prompt,
        inputSummary: {
          petReference: petReference.contentType,
          baseStyle: baseStyle.contentType,
          variant,
        },
      },
      run: async (requestId) => {
        const bytes = mockImage({
          label: `avatar ${variant}`,
          fill: variant === 1 ? "#f7c86f" : variant === 2 ? "#9cc9b8" : "#f2a0a1",
        });

        await markAiRequestSucceeded({
          requestId,
          outputSummary: {
            contentType: "image/svg+xml",
            byteLength: bytes.length,
          },
        });

        return {
          bytes,
          contentType: "image/svg+xml",
          prompt,
        };
      },
    });
  }

  const openai = getOpenAIClient();
  const [preparedReference, preparedStyle] = await Promise.all([
    prepareEditImage(petReference, "jpeg"),
    prepareEditImage(baseStyle, "png"),
  ]);
  const [referenceFile, styleFile] = await Promise.all([
    toFile(preparedReference.bytes, "pet-reference.jpg", {
      type: preparedReference.contentType,
    }),
    toFile(preparedStyle.bytes, "base-avatar-style.png", {
      type: preparedStyle.contentType,
    }),
  ]);
  const request: Images.ImageEditParamsNonStreaming = {
    model: openAIImageModel,
    image: [referenceFile, styleFile],
    prompt,
    output_format: "png",
    size: openAIImageSize,
  };

  return recordAiRequest({
    input: {
      metadata,
      provider: "openai",
      model: openAIImageModel,
      prompt,
      inputSummary: {
        petReference: preparedReference.contentType,
        baseStyle: preparedStyle.contentType,
        variant,
        size: openAIImageSize,
      },
    },
    run: async (requestId) => {
      const result = await openai.images.edit(request);
      const generatedBase64 = result.data?.[0]?.b64_json;

      if (!generatedBase64) {
        throw new Error("avatar_generation_empty");
      }

      const bytes = Buffer.from(generatedBase64, "base64");

      await markAiRequestSucceeded({
        requestId,
        outputSummary: {
          contentType: "image/png",
          byteLength: bytes.length,
        },
        providerRequestId: result._request_id ?? null,
      });

      return {
        bytes,
        contentType: "image/png",
        prompt,
      };
    },
  });
}

export async function generateDailyThoughtImageBytes({
  avatar,
  hoominAvatar,
  journalPhoto,
  petName,
  species,
  thoughtText,
  journalText,
  metadata,
}: {
  avatar: { bytes: Buffer; contentType: string };
  hoominAvatar?: { bytes: Buffer; contentType: string } | null;
  journalPhoto?: { bytes: Buffer; contentType: string } | null;
  petName: string;
  species: string | null;
  thoughtText: string;
  journalText?: string | null;
  metadata: GenerationTraceMetadata;
}) {
  const prompt = buildThoughtImagePrompt({
    petName,
    species,
    thoughtText,
    journalText,
    hasHoominAvatar: Boolean(hoominAvatar),
  });

  if (process.env.APP_AI_ADAPTER === "mock") {
    return recordAiRequest({
      input: {
        metadata,
        provider: "mock",
        model: "mock-image",
        prompt,
        inputSummary: {
          avatar: avatar.contentType,
          hoominAvatar: hoominAvatar?.contentType ?? null,
          journalPhoto: journalPhoto?.contentType ?? null,
        },
      },
      run: async (requestId) => {
        const bytes = mockImage({ label: "tiny musing", fill: "#b8d7f1" });

        await markAiRequestSucceeded({
          requestId,
          outputSummary: {
            contentType: "image/svg+xml",
            byteLength: bytes.length,
          },
        });

        return {
          bytes,
          contentType: "image/svg+xml",
          prompt,
        };
      },
    });
  }

  const openai = getOpenAIClient();
  const [preparedAvatar, preparedHoominAvatar, preparedJournalPhoto] = await Promise.all([
    prepareEditImage(avatar, "png"),
    hoominAvatar ? prepareEditImage(hoominAvatar, "jpeg") : Promise.resolve(null),
    journalPhoto ? prepareEditImage(journalPhoto, "jpeg") : Promise.resolve(null),
  ]);
  const images = [
    await toFile(preparedAvatar.bytes, "selected-avatar.png", {
      type: preparedAvatar.contentType,
    }),
  ];

  if (preparedHoominAvatar) {
    images.push(
      await toFile(preparedHoominAvatar.bytes, "hoomin-avatar.jpg", {
        type: preparedHoominAvatar.contentType,
      }),
    );
  }

  if (preparedJournalPhoto) {
    images.push(
      await toFile(preparedJournalPhoto.bytes, "journal-photo.jpg", {
        type: preparedJournalPhoto.contentType,
      }),
    );
  }

  const request: Images.ImageEditParamsNonStreaming = {
    model: openAIImageModel,
    image: images.length === 1 ? images[0] : images,
    prompt,
    output_format: "png",
    size: openAIImageSize,
  };

  return recordAiRequest({
    input: {
      metadata,
      provider: "openai",
      model: openAIImageModel,
      prompt,
      inputSummary: {
        avatar: preparedAvatar.contentType,
        hoominAvatar: preparedHoominAvatar?.contentType ?? null,
        journalPhoto: preparedJournalPhoto?.contentType ?? null,
        imageCount: images.length,
        size: openAIImageSize,
      },
    },
    run: async (requestId) => {
      const result = await openai.images.edit(request);
      const generatedBase64 = result.data?.[0]?.b64_json;

      if (!generatedBase64) {
        throw new Error("image_generation_empty");
      }

      const bytes = Buffer.from(generatedBase64, "base64");

      await markAiRequestSucceeded({
        requestId,
        outputSummary: {
          contentType: "image/png",
          byteLength: bytes.length,
        },
        providerRequestId: result._request_id ?? null,
      });

      return {
        bytes,
        contentType: "image/png",
        prompt,
      };
    },
  });
}
