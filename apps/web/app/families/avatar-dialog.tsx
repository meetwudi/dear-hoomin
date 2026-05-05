import type { ReactNode } from "react";
import type {
  AvatarCandidate,
  AvatarIdentity,
} from "../../lib/avatar-identities/types";
import { productCopy } from "../../lib/product-copy";
import { AvatarSelectionPanel } from "../components/avatar-selection-panel";
import { AvatarDialogClient } from "./avatar-dialog-client";

export function AvatarDialog({
  avatarIdentity,
  buttonLabel,
  candidates = [],
  chooseAction,
  chooseFields,
  currentImageAlt,
  displayName,
  emptyMessage,
  familyId,
  generationError = null,
  generationStatus = "not_started",
  generateAction,
  generateFields,
  heading,
  referencePhotoPath,
  redirectTo,
  selectedAvatarPath,
  subjectId,
  subjectType,
  uploadAction,
}: {
  avatarIdentity?: AvatarIdentity | null;
  buttonLabel?: string;
  candidates?: AvatarCandidate[];
  chooseAction?: (formData: FormData) => void | Promise<void>;
  chooseFields?: (candidate: AvatarCandidate) => ReactNode;
  currentImageAlt: string;
  displayName: string;
  emptyMessage: string;
  familyId: string;
  generationError?: string | null;
  generationStatus?: "not_started" | "in_progress" | "succeeded" | "failed";
  generateAction?: (formData: FormData) => void | Promise<void>;
  generateFields?: ReactNode;
  heading: string;
  referencePhotoPath?: string | null;
  redirectTo: string;
  selectedAvatarPath?: string | null;
  subjectId: string;
  subjectType: "pet" | "hoomin" | "companion_object";
  uploadAction: (formData: FormData) => void | Promise<void>;
}) {
  const effectiveReferencePhotoPath =
    avatarIdentity?.referencePhotoPath ?? referencePhotoPath ?? null;
  const effectiveSelectedAvatarPath =
    avatarIdentity?.selectedAvatarPath ?? selectedAvatarPath ?? null;
  const referencePhotoLabel =
    subjectType === "pet"
      ? productCopy.avatars.realWorldPhotoLabel
      : productCopy.avatars.referencePhotoLabel;
  const uploadButtonLabel =
    subjectType === "pet"
      ? effectiveReferencePhotoPath
        ? productCopy.avatars.replaceRealWorldPhotoButton
        : productCopy.avatars.saveRealWorldPhotoButton
      : productCopy.avatars.uploadReferenceButton;
  const hasAvatar = Boolean(
    effectiveSelectedAvatarPath || effectiveReferencePhotoPath,
  );

  return (
    <AvatarDialogClient
      buttonLabel={
        buttonLabel ??
        (hasAvatar ? productCopy.avatars.changeButton : productCopy.avatars.setButton)
      }
    >
      <AvatarSelectionPanel
        candidates={avatarIdentity?.avatarCandidates ?? candidates}
        chooseAction={chooseAction}
        chooseFields={chooseFields}
        currentImageAlt={currentImageAlt}
        displayName={displayName}
        emptyMessage={emptyMessage}
        generationError={avatarIdentity?.avatarGenerationError ?? generationError}
        generationStatus={avatarIdentity?.avatarGenerationStatus ?? generationStatus}
        generateAction={generateAction}
        generateFields={generateFields}
        heading={heading}
        referencePhotoAlt={productCopy.media.originalUploadAlt(displayName)}
        referencePhotoLabel={referencePhotoLabel}
        referencePhotoPath={effectiveReferencePhotoPath}
        redirectTo={redirectTo}
        selectedAvatarLabel={productCopy.avatars.selectedAvatarLabel}
        selectedAvatarPath={effectiveSelectedAvatarPath}
        uploadAction={uploadAction}
        uploadButtonLabel={uploadButtonLabel}
        uploadFields={
          <>
            <input name="familyId" type="hidden" value={familyId} />
            <input name="subjectType" type="hidden" value={subjectType} />
            <input name="subjectId" type="hidden" value={subjectId} />
            <input name="displayName" type="hidden" value={displayName} />
          </>
        }
        uploadPhotoLabel={referencePhotoLabel}
      />
    </AvatarDialogClient>
  );
}
