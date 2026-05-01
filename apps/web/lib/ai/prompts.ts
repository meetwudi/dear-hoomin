export const avatarStyleSystemPrompt = [
  "Create a small, cozy pet avatar that follows the supplied base style image.",
  "The style is system-owned: keep the same doodle-like, warm, readable, mobile-friendly character treatment.",
  "Use the pet reference photo only for identity details such as markings, shape, and expression.",
  "The user may ask for content tweaks, but do not change the base visual style.",
  "No words, captions, logos, UI, or watermark in the image.",
].join(" ");

export function buildAvatarCandidatePrompt({
  petName,
  species,
  instructions,
  variant,
}: {
  petName: string;
  species: string | null;
  instructions: string | null;
  variant: number;
}) {
  return [
    avatarStyleSystemPrompt,
    `Pet name: ${petName}.`,
    species ? `Species: ${species}.` : "Species: beloved household pet.",
    `Make avatar option ${variant} distinct in pose or expression while staying on-model.`,
    instructions ? `Allowed content tweak from hoomin: ${instructions}` : null,
    "Square 128px avatar composition. Transparent-looking clean background is okay, but output a PNG.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildThoughtTextPrompt({
  petName,
  species,
}: {
  petName: string;
  species: string | null;
}) {
  return [
    "Write today's thought from the pet's perspective.",
    `Pet name: ${petName}.`,
    species ? `Species: ${species}.` : "Species: beloved household pet.",
    "Voice: cute, cozy, conversational, a little silly, like the pet is talking to their hoomin.",
    "Use natural pet/hoomin phrasing, but keep it readable.",
    "Return only the thought text. Maximum 160 characters. No hashtags. No quotation marks.",
  ].join(" ");
}

export function buildThoughtImagePrompt({
  petName,
  species,
  thoughtText,
}: {
  petName: string;
  species: string | null;
  thoughtText: string;
}) {
  return [
    `Create today's cozy doodle image for ${petName}.`,
    species ? `The pet is a ${species}.` : "The pet is an adored household pet.",
    `Use this selected avatar as the pet identity anchor.`,
    `Thought from the pet: "${thoughtText}"`,
    "Keep the same cute, warm, readable avatar style. No text in the image.",
  ].join(" ");
}
