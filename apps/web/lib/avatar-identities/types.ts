export type AvatarSubjectType = "pet" | "hoomin" | "companion_object";

export type AvatarCandidate = {
  id: string;
  fileId: string;
  imagePath: string;
  selectedAt: string | null;
};

export type AvatarIdentity = {
  id: string;
  familyId: string;
  subjectType: AvatarSubjectType;
  subjectId: string;
  displayName: string;
  referencePhotoPath: string | null;
  selectedAvatarPath: string | null;
  avatarGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  avatarGenerationError: string | null;
  avatarCandidates: AvatarCandidate[];
};
