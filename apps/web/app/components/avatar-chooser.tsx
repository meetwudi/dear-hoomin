import type { PetSummary } from "../../lib/pets/types";
import {
  choosePetAvatarAction,
  generatePetAvatarsAction,
} from "../pets/actions";

export function AvatarChooser({ pet }: { pet: PetSummary }) {
  const isGenerating = pet.avatarGenerationStatus === "in_progress";

  return (
    <section className="section-block avatar-chooser" aria-labelledby="avatar-heading">
      <h2 id="avatar-heading">Choose {pet.name}&apos;s little face</h2>
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
              <button className="avatar-choice" type="submit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${pet.name} avatar option`} src={`/files/${candidate.imagePath}`} />
                <span>{candidate.selectedAt ? "Picked" : "Pick me"}</span>
              </button>
            </form>
          ))}
        </div>
      ) : (
        <p className="supporting-copy compact-copy">
          We need a tiny avatar before {pet.name} can post thoughts.
        </p>
      )}
      <form action={generatePetAvatarsAction} className="stacked-form">
        <input name="petId" type="hidden" value={pet.id} />
        <label>
          Tiny note for the next set
          <input
            maxLength={1000}
            name="instructions"
            placeholder="maybe more sleepy, still same style"
          />
        </label>
        <button className="primary-button" disabled={isGenerating} type="submit">
          {isGenerating ? "Doodling..." : "Make 3 new avatars"}
        </button>
      </form>
    </section>
  );
}
