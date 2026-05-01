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
  todayThoughts: DailyThought[];
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
  source: "daily" | "journal";
  text: string;
  journalText: string | null;
  imageFileId: string | null;
  imagePath: string | null;
  imageGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  imageGenerationError: string | null;
  journalPhotos: JournalPhoto[];
};

export type JournalPhoto = {
  id: string;
  imagePath: string;
  contentType: string | null;
};
