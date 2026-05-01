import type { PetSummary } from "../../lib/pets/types";
import {
  choosePetAvatarAction,
  generatePetAvatarsAction,
} from "../pets/actions";
import { PendingSubmitButton } from "./pending-submit-button";

export function AvatarChooser({
  avatarInstructions = null,
  pet,
}: {
  avatarInstructions?: string | null;
  pet: PetSummary;
}) {
  const isGenerating = pet.avatarGenerationStatus === "in_progress";

  return (
    <div className="avatar-chooser" aria-labelledby="avatar-heading">
      <h2 id="avatar-heading">Which one looks most like {pet.name}?</h2>
      {pet.avatarGenerationError ? (
        <p className="admin-status">That doodle wandered off. Try again.</p>
      ) : null}
      {isGenerating ? (
        <div className="inline-loading" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          Making three tiny faces
        </div>
      ) : null}
      {pet.avatarCandidates.length > 0 ? (
        <div className="avatar-grid">
          {pet.avatarCandidates.slice(0, 3).map((candidate) => (
            <form action={choosePetAvatarAction} key={candidate.id}>
              <input name="petId" type="hidden" value={pet.id} />
              <input name="candidateId" type="hidden" value={candidate.id} />
              <PendingSubmitButton
                className="avatar-choice"
                disabled={isGenerating}
                pendingLabel="Picking..."
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name} avatar option`} src={`/files/${candidate.imagePath}`} />
                <span>{candidate.selectedAt ? "Picked" : "Pick me"}</span>
              </PendingSubmitButton>
            </form>
          ))}
        </div>
      ) : isGenerating ? (
        <div className="avatar-grid" aria-label="Avatar generation loading">
          {[1, 2, 3].map((slot) => (
            <div className="avatar-loading-card" key={slot}>
              <div className="cutie-loading-face" aria-hidden="true">
                <span />
              </div>
              <small>tiny face {slot}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="supporting-copy compact-copy">
          We need a tiny avatar before {pet.name} can post thoughts.
        </p>
      )}
      <form action={generatePetAvatarsAction} className="stacked-form">
        <input name="petId" type="hidden" value={pet.id} />
        <input name="instructions" type="hidden" value={avatarInstructions ?? ""} />
        <PendingSubmitButton
          disabled={isGenerating}
          pendingLabel="Uploading..."
        >
          {isGenerating ? "Doodling..." : "Make 3 new avatars"}
        </PendingSubmitButton>
      </form>
    </div>
  );
}
