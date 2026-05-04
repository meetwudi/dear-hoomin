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
  journalText,
  recentThoughts,
  extraInstructions,
}: {
  petName: string;
  species: string | null;
  journalText?: string | null;
  recentThoughts?: string[];
  extraInstructions?: string | null;
}) {
  return [
    journalText
      ? "Write a pet musing inspired by this hoomin journal note and the uploaded pet photo."
      : "Write today's daily musing from the pet's perspective.",
    `Pet name: ${petName}.`,
    species ? `Species: ${species}.` : "Species: beloved household pet.",
    journalText ? `Hoomin journal note: ${journalText}` : null,
    recentThoughts?.length
      ? `Avoid repeating these recent musings: ${recentThoughts.join(" | ")}`
      : null,
    extraInstructions ? `Hoomin writing instructions: ${extraInstructions}` : null,
    "Voice: cute, cozy, conversational, a little silly, like the pet is talking to their hoomin.",
    "Use natural pet/hoomin phrasing, but keep it readable.",
    "Return only the pet's musing text, with no title, label, setup, prefix, colon heading, or framing phrase.",
    "Do not start with phrases like today's musing, today's thought, today's mission, today's journal, or mission.",
    "Maximum 160 characters. No hashtags. No quotation marks.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildThoughtImagePrompt({
  petName,
  species,
  thoughtText,
  journalText,
}: {
  petName: string;
  species: string | null;
  thoughtText: string;
  journalText?: string | null;
}) {
  return [
    `Create today's cozy doodle image for ${petName}.`,
    species ? `The pet is a ${species}.` : "The pet is an adored household pet.",
    `Use this selected avatar as the pet identity anchor.`,
    journalText ? "If a journal photo is supplied, use it as scene/context inspiration without changing the pet identity." : null,
    journalText ? `Hoomin journal note: ${journalText}` : null,
    `Musing from the pet: "${thoughtText}"`,
    "Keep the same cute, warm, readable avatar style. No text in the image.",
  ]
    .filter(Boolean)
    .join(" ");
}
