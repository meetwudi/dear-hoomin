import type { PetSummary } from "../../lib/pets/types";
import { productCopy } from "../../lib/product-copy";
import {
  choosePetAvatarAction,
  generatePetAvatarsAction,
} from "../pets/actions";
import { PendingSubmitButton } from "./pending-submit-button";

export function AvatarChooser({
  avatarInstructions = null,
  pet,
  redirectTo,
}: {
  avatarInstructions?: string | null;
  pet: PetSummary;
  redirectTo?: string;
}) {
  const isGenerating = pet.avatarGenerationStatus === "in_progress";

  return (
    <div className="avatar-chooser" aria-labelledby="avatar-heading">
      <h2 id="avatar-heading">{productCopy.avatars.heading(pet.name)}</h2>
      {pet.avatarGenerationError ? (
        <p className="admin-status">{productCopy.avatars.error}</p>
      ) : null}
      {isGenerating ? (
        <div className="inline-loading" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          {productCopy.avatars.generating}
        </div>
      ) : null}
      {pet.avatarCandidates.length > 0 ? (
        <div className="avatar-grid">
          {pet.avatarCandidates.slice(0, 3).map((candidate) => (
            <form action={choosePetAvatarAction} key={candidate.id}>
              <input name="petId" type="hidden" value={pet.id} />
              <input name="candidateId" type="hidden" value={candidate.id} />
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
                  alt={productCopy.media.avatarOptionAlt(pet.name)}
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
          {productCopy.avatars.needsAvatar(pet.name)}
        </p>
      )}
      <form action={generatePetAvatarsAction} className="stacked-form">
        <input name="petId" type="hidden" value={pet.id} />
        <input name="instructions" type="hidden" value={avatarInstructions ?? ""} />
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
    </div>
  );
}
