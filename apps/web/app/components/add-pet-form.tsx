import { productCopy } from "../../lib/product-copy";
import { createPetAction } from "../pets/actions";
import { PendingSubmitButton } from "./pending-submit-button";
import { PhotoPicker } from "./photo-picker";

export function AddPetForm({
  familyId,
  redirectTo,
}: {
  familyId: string;
  redirectTo?: string;
}) {
  return (
    <form action={createPetAction} className="pet-form">
      <input name="familyId" type="hidden" value={familyId} />
      {redirectTo ? (
        <input name="redirectTo" type="hidden" value={redirectTo} />
      ) : null}
      <label>
        {productCopy.petForm.nameLabel}
        <input
          maxLength={80}
          name="name"
          placeholder={productCopy.petForm.namePlaceholder}
          required
        />
      </label>
      <label>
        {productCopy.petForm.referencePhotoLabel}
        <PhotoPicker name="photo" required />
      </label>
      <PendingSubmitButton pendingLabel={productCopy.petForm.addingButton}>
        {productCopy.petForm.addButton}
      </PendingSubmitButton>
    </form>
  );
}
