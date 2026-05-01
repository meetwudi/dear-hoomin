import { createPetAction } from "../pets/actions";

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
        <input
          accept="image/jpeg,image/png,image/webp"
          name="photo"
          required
          type="file"
        />
      </label>
      <button className="primary-button" type="submit">
        Add pet
      </button>
    </form>
  );
}
