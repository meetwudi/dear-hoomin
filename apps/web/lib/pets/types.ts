export type PetSummary = {
  id: string;
  familyId: string;
  name: string;
  species: string | null;
  referencePhotoPath: string | null;
  selectedAvatarPath: string | null;
  avatarGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  avatarGenerationError: string | null;
  avatarCandidates: PetAvatarCandidate[];
  todayThought: DailyThought | null;
};

export type PetAvatarCandidate = {
  id: string;
  petId: string;
  fileId: string;
  imagePath: string;
  selectedAt: string | null;
};

export type DailyThought = {
  id: string;
  publicShareToken: string;
  petId: string;
  localDate: string;
  text: string;
  imageFileId: string | null;
  imagePath: string | null;
  imageGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  imageGenerationError: string | null;
};
