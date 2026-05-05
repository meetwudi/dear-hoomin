import type { ReactNode } from "react";
import type { AvatarCandidate } from "../../lib/avatar-identities/types";
import { productCopy } from "../../lib/product-copy";
import { PhotoPicker } from "./photo-picker";
import { PendingSubmitButton } from "./pending-submit-button";

type AvatarSelectionPanelProps = {
  candidates: AvatarCandidate[];
  currentImageAlt: string;
  displayName: string;
  emptyMessage: string;
  generationError: string | null;
  generationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  heading: string;
  referencePhotoAlt: string;
  referencePhotoLabel: string;
  referencePhotoPath: string | null;
  selectedAvatarPath: string | null;
  selectedAvatarLabel: string;
  uploadAction?: (formData: FormData) => void | Promise<void>;
  uploadButtonLabel: string;
  uploadFields?: ReactNode;
  uploadPhotoLabel: string;
  chooseAction?: (formData: FormData) => void | Promise<void>;
  chooseFields?: (candidate: AvatarCandidate) => ReactNode;
  generateAction?: (formData: FormData) => void | Promise<void>;
  generateFields?: ReactNode;
  redirectTo?: string;
};

export function AvatarSelectionPanel({
  candidates,
  currentImageAlt,
  displayName,
  emptyMessage,
  generationError,
  generationStatus,
  heading,
  referencePhotoAlt,
  referencePhotoLabel,
  referencePhotoPath,
  selectedAvatarPath,
  selectedAvatarLabel,
  uploadAction,
  uploadButtonLabel,
  uploadFields,
  uploadPhotoLabel,
  chooseAction,
  chooseFields,
  generateAction,
  generateFields,
  redirectTo,
}: AvatarSelectionPanelProps) {
  const isGenerating = generationStatus === "in_progress";

  return (
    <div className="avatar-chooser" aria-labelledby="avatar-heading">
      <div className="avatar-panel-heading">
        <h2 id="avatar-heading">{heading}</h2>
        {selectedAvatarPath ? (
          <figure className="avatar-preview-card">
            <div className="pet-card-media settings-avatar avatar-current-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={currentImageAlt} src={`/files/${selectedAvatarPath}`} />
            </div>
            <figcaption>{selectedAvatarLabel}</figcaption>
          </figure>
        ) : null}
      </div>
      {referencePhotoPath ? (
        <figure className="avatar-source-preview">
          <div className="pet-card-media settings-avatar avatar-current-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={referencePhotoAlt} src={`/files/${referencePhotoPath}`} />
          </div>
          <figcaption>{referencePhotoLabel}</figcaption>
        </figure>
      ) : null}
      {generationError ? (
        <p className="admin-status">{productCopy.avatars.error}</p>
      ) : null}
      {isGenerating ? (
        <div className="inline-loading" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          {productCopy.avatars.generating}
        </div>
      ) : null}
      {candidates.length > 0 && chooseAction && chooseFields ? (
        <div className="avatar-grid">
          {candidates.slice(0, 3).map((candidate) => (
            <form action={chooseAction} key={candidate.id}>
              {chooseFields(candidate)}
              {redirectTo ? (
                <input name="redirectTo" type="hidden" value={redirectTo} />
              ) : null}
              <PendingSubmitButton
                className="avatar-choice"
                disabled={isGenerating}
                pendingLabel={productCopy.avatars.pickingButton}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={productCopy.media.avatarOptionAlt(displayName)}
                  src={`/files/${candidate.imagePath}`}
                />
                <span>
                  {candidate.selectedAt
                    ? productCopy.avatars.pickedButton
                    : productCopy.avatars.pickMeButton}
                </span>
              </PendingSubmitButton>
            </form>
          ))}
        </div>
      ) : isGenerating ? (
        <div className="avatar-grid" aria-label={productCopy.avatars.loadingGridLabel}>
          {[1, 2, 3].map((slot) => (
            <div className="avatar-loading-card" key={slot}>
              <div className="cutie-loading-face" aria-hidden="true">
                <span />
              </div>
              <small>{productCopy.avatars.loadingSlot(slot)}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="supporting-copy compact-copy">
          {emptyMessage}
        </p>
      )}
      {generateAction ? (
        <form action={generateAction} className="stacked-form">
          {generateFields}
          {redirectTo ? (
            <input name="redirectTo" type="hidden" value={redirectTo} />
          ) : null}
          <PendingSubmitButton
            disabled={isGenerating}
            pendingLabel={productCopy.avatars.uploadingButton}
          >
            {isGenerating
              ? productCopy.avatars.doodlingButton
              : productCopy.avatars.makeNewButton}
          </PendingSubmitButton>
        </form>
      ) : null}
      {uploadAction ? (
        <form action={uploadAction} className="stacked-form compact-form">
          {uploadFields}
          {redirectTo ? (
            <input name="redirectTo" type="hidden" value={redirectTo} />
          ) : null}
          <label>
            {uploadPhotoLabel}
            <PhotoPicker name="photo" required />
          </label>
          <PendingSubmitButton pendingLabel={productCopy.avatars.uploadingButton}>
            {uploadButtonLabel}
          </PendingSubmitButton>
        </form>
      ) : null}
    </div>
  );
}
