import { createPetAction } from "../pets/actions";
import { PendingSubmitButton } from "./pending-submit-button";
import { PhotoPicker } from "./photo-picker";

export function AddPetForm({ familyId }: { familyId: string }) {
  return (
    <form action={createPetAction} className="pet-form">
      <input name="familyId" type="hidden" value={familyId} />
      <label>
        Pet name
        <input maxLength={80} name="name" placeholder="Mochi" required />
      </label>
      <label>
        Species
        <input maxLength={80} name="species" placeholder="cat, dog..." />
      </label>
      <label>
        Reference photo
        <PhotoPicker name="photo" required />
      </label>
      <PendingSubmitButton pendingLabel="Adding pet...">
        Add pet
      </PendingSubmitButton>
    </form>
  );
}
