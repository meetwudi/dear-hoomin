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
        Furbaby name
        <input maxLength={80} name="name" placeholder="Mochi" required />
      </label>
      <label>
        Reference photo
        <PhotoPicker name="photo" required />
      </label>
      <PendingSubmitButton pendingLabel="Adding pet...">
        Add furbaby
      </PendingSubmitButton>
    </form>
  );
}
