import OpenAI from "openai";

// Platform note: update harness/platform-dependencies.md when OpenAI usage changes.

export const openAIImageModel = "gpt-image-2";
export const openAIAvatarImageQuality = "low";
export const openAIImageSize = "1024x1024";
export const openAITextModel = "gpt-4.1-mini";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}
