import type { PetSummary } from "../../lib/pets/types";
import { productCopy } from "../../lib/product-copy";
import {
  choosePetAvatarAction,
  generatePetAvatarsAction,
} from "../pets/actions";
import { AvatarSelectionPanel } from "./avatar-selection-panel";

export function AvatarChooser({
  avatarInstructions = null,
  pet,
  redirectTo,
}: {
  avatarInstructions?: string | null;
  pet: PetSummary;
  redirectTo?: string;
}) {
  return (
    <AvatarSelectionPanel
      candidates={pet.avatarCandidates.map((candidate) => ({
        id: candidate.id,
        fileId: candidate.fileId,
        imagePath: candidate.imagePath,
        selectedAt: candidate.selectedAt,
      }))}
      chooseAction={choosePetAvatarAction}
      chooseFields={(candidate) => (
        <>
          <input name="petId" type="hidden" value={pet.id} />
          <input name="candidateId" type="hidden" value={candidate.id} />
        </>
      )}
      currentImageAlt={productCopy.media.selectedAvatarAlt(pet.name)}
      displayName={pet.name}
      emptyMessage={productCopy.avatars.petEmpty(pet.name)}
      generateAction={generatePetAvatarsAction}
      generateFields={
        <>
          <input name="petId" type="hidden" value={pet.id} />
          <input name="instructions" type="hidden" value={avatarInstructions ?? ""} />
        </>
      }
      generationError={pet.avatarGenerationError}
      generationStatus={pet.avatarGenerationStatus}
      heading={productCopy.avatars.heading(pet.name)}
      referencePhotoAlt={productCopy.media.originalUploadAlt(pet.name)}
      referencePhotoLabel={productCopy.avatars.realWorldPhotoLabel}
      redirectTo={redirectTo}
      referencePhotoPath={pet.referencePhotoPath}
      selectedAvatarLabel={productCopy.avatars.selectedAvatarLabel}
      selectedAvatarPath={pet.selectedAvatarPath}
      uploadButtonLabel={productCopy.avatars.saveRealWorldPhotoButton}
      uploadPhotoLabel={productCopy.avatars.realWorldPhotoLabel}
    />
  );
}
