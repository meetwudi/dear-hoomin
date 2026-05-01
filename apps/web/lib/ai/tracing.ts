export type GenerationTraceMetadata = {
  familyId: string;
  petId: string;
  thoughtId?: string;
  generationType: "pet_avatar" | "daily_thought_text" | "daily_thought_image";
};

export function openAIMetadata(metadata: GenerationTraceMetadata) {
  return {
    app: "dear-hoomin",
    family_id: metadata.familyId,
    pet_id: metadata.petId,
    thought_id: metadata.thoughtId ?? "",
    generation_type: metadata.generationType,
  };
}
