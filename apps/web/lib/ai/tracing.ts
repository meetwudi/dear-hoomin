export type GenerationTraceMetadata = {
  familyId: string;
  petId?: string;
  thoughtId?: string;
  requestedByHoominId?: string | null;
  generationType:
    | "pet_avatar"
    | "hoomin_avatar"
    | "avatar_identity"
    | "daily_thought_text"
    | "daily_thought_image"
    | "journal_thought_text"
    | "journal_thought_image";
};

export function openAIMetadata(metadata: GenerationTraceMetadata) {
  return {
    app: "dear-hoomin",
    family_id: metadata.familyId,
    pet_id: metadata.petId ?? "",
    thought_id: metadata.thoughtId ?? "",
    generation_type: metadata.generationType,
  };
}
