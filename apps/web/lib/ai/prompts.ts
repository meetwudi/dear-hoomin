export const avatarStyleSystemPrompt = [
  "Create a small, cozy avatar that follows the supplied base style image.",
  "The style is system-owned: keep the same doodle-like, warm, readable, mobile-friendly character treatment.",
  "Use the reference photo for identity details such as shape, markings, hair, face, and expression.",
  "Do not preserve the exact outfit from the reference photo. Clothing can change to fit a cute cozy avatar.",
  "The user may ask for content tweaks, but do not change the base visual style.",
  "No words, captions, logos, UI, or watermark in the image.",
].join(" ");

export function buildAvatarCandidatePrompt({
  petName,
  species,
  instructions,
  subjectType = "pet",
  variant,
}: {
  petName: string;
  species: string | null;
  instructions: string | null;
  subjectType?: "pet" | "hoomin";
  variant: number;
}) {
  const isHoomin = subjectType === "hoomin";

  return [
    avatarStyleSystemPrompt,
    isHoomin ? `Hoomin name: ${petName}.` : `Pet name: ${petName}.`,
    isHoomin
      ? "Subject: beloved family hoomin."
      : species ? `Species: ${species}.` : "Species: beloved household pet.",
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
  hasHoominAvatar = false,
  hasHoominReferenceSheet = false,
  hoominAvatarReferenceName,
}: {
  petName: string;
  species: string | null;
  thoughtText: string;
  journalText?: string | null;
  hasHoominAvatar?: boolean;
  hasHoominReferenceSheet?: boolean;
  hoominAvatarReferenceName?: string | null;
}) {
  return [
    `Create today's cozy doodle image for ${petName}.`,
    species ? `The pet is a ${species}.` : "The pet is an adored household pet.",
    `The first input image is ${petName}'s selected pet avatar. Use it as the primary identity and style anchor for the pet.`,
    "Do not replace the pet with a realistic animal or with details from any other input image.",
    hasHoominReferenceSheet
      ? "The second input image is a reference sheet of hoomin avatars. Each hoomin tile is labeled by the name the musing may use, such as poppa or mooma. Pick the matching named hoomin from that sheet when the musing names one, and do not copy any hoomin details onto the pet. The hoomin's clothing can adapt to the scene."
      : hasHoominAvatar
      ? hoominAvatarReferenceName
        ? `The second input image is a referenced hoomin avatar/photo for "${hoominAvatarReferenceName}". Include that hoomin when the scene mentions or implies ${hoominAvatarReferenceName}, and preserve their identity from that image without changing ${petName}'s avatar identity. The hoomin's clothing can adapt to the scene.`
        : `The second input image is a hoomin avatar/photo. Include the hoomin only if it naturally fits the scene, and preserve their identity without changing ${petName}'s avatar identity. The hoomin's clothing can adapt to the scene.`
      : null,
    journalText ? "If a journal photo is supplied, it is only scene/context inspiration. It must not override the selected pet avatar." : null,
    journalText ? `Hoomin journal note: ${journalText}` : null,
    `Musing from the pet: "${thoughtText}"`,
    "Keep the same cute, warm, readable avatar style. No text in the image.",
  ]
    .filter(Boolean)
    .join(" ");
}
