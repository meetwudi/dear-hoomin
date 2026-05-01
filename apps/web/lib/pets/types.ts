export type PetSummary = {
  id: string;
  familyId: string;
  name: string;
  species: string | null;
  referencePhotoPath: string | null;
  todayThought: DailyThought | null;
};

export type DailyThought = {
  id: string;
  petId: string;
  localDate: string;
  text: string;
  imageFileId: string | null;
  imagePath: string | null;
  imageGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  imageGenerationError: string | null;
};
