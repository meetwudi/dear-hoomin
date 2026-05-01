import { randomBytes } from "node:crypto";
import OpenAI, { toFile } from "openai";
import { downloadAppFile, uploadAppFile } from "../storage/supabase-storage";
import {
  attachGeneratedThoughtImage,
  getPetForCronGeneration,
  getPetForGeneration,
  getTodayIsoDate,
  markThoughtGenerationFailed,
  markThoughtGenerationInProgress,
} from "./store";

type GenerationPetRecord = {
  pet_id: string;
  family_id: string;
  pet_name: string;
  species: string | null;
  thought_id: string | null;
  thought_text: string | null;
  reference_photo_path: string | null;
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

function getImageSize() {
  const imageSize = process.env.OPENAI_IMAGE_SIZE;

  if (imageSize === "512x512" || imageSize === "1024x1024") {
    return imageSize;
  }

  return "256x256";
}

function buildPrompt({
  petName,
  species,
  thoughtText,
}: {
  petName: string;
  species: string | null;
  thoughtText: string;
}) {
  return [
    `Create a warm cartoon-style daily thought image for ${petName}.`,
    species ? `The pet is a ${species}.` : "The pet is an adored household pet.",
    `Daily thought text: "${thoughtText}"`,
    "Preserve the pet's visible identity from the reference photo.",
    "Keep it cute, sincere, slightly absurd, and cozy. No text in the image.",
  ].join(" ");
}

export async function generateDailyThoughtImage(
  petId: string,
  hoominId: string,
) {
  const pet = await getPetForGeneration(petId, hoominId);

  if (!pet || !pet.thought_id || !pet.thought_text || !pet.reference_photo_path) {
    return { status: "not_ready" as const };
  }

  return generateForPetRecord(pet);
}

async function generateForPetRecord(pet: GenerationPetRecord) {
  if (!pet.thought_id || !pet.thought_text || !pet.reference_photo_path) {
    return { status: "not_ready" as const };
  }

  const didMarkInProgress = await markThoughtGenerationInProgress(pet.thought_id);

  if (!didMarkInProgress) {
    return { status: "in_progress" as const };
  }

  const prompt = buildPrompt({
    petName: pet.pet_name,
    species: pet.species,
    thoughtText: pet.thought_text,
  });

  try {
    const referencePhoto = await downloadAppFile(pet.reference_photo_path);

    if (!referencePhoto) {
      throw new Error("reference_photo_missing");
    }

    const openai = getOpenAIClient();
    const image = await toFile(
      referencePhoto.bytes,
      "pet-reference.jpg",
      { type: referencePhoto.contentType },
    );
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image,
      prompt,
      input_fidelity: "high",
      output_format: "png",
      size: getImageSize(),
    });
    const generatedBase64 = result.data?.[0]?.b64_json;

    if (!generatedBase64) {
      throw new Error("image_generation_empty");
    }

    const storagePath = `${pet.family_id}/thoughts/${pet.thought_id}/generated-${randomBytes(8).toString("hex")}.png`;
    const storedFile = await uploadAppFile({
      path: storagePath,
      contentType: "image/png",
      bytes: Buffer.from(generatedBase64, "base64"),
    });

    await attachGeneratedThoughtImage({
      familyId: pet.family_id,
      thoughtId: pet.thought_id,
      storagePath: storedFile.path,
      contentType: storedFile.contentType,
      prompt,
    });

    return { status: "succeeded" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "image_generation_failed";
    await markThoughtGenerationFailed(pet.thought_id, message);
    return { status: "failed" as const };
  }
}

export async function generateDailyThoughtImageForCron(petId: string) {
  const pet = await getPetForCronGeneration(petId, getTodayIsoDate());

  if (!pet || !pet.thought_id || !pet.thought_text || !pet.reference_photo_path) {
    return { status: "not_ready" as const };
  }

  return generateForPetRecord(pet);
}
