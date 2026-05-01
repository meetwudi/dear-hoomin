"use client";

type FurbabySelectorPet = {
  id: string;
  name: string;
};

export function FurbabySelector({
  familyId,
  pets,
  selectedPetId,
}: {
  familyId: string;
  pets: FurbabySelectorPet[];
  selectedPetId: string;
}) {
  return (
    <label className="furbaby-selector">
      Furbaby
      <select
        onChange={(event) => {
          const params = new URLSearchParams(window.location.search);
          params.set("petId", event.currentTarget.value);
          params.delete("addPet");
          window.location.href = `/families/${familyId}?${params.toString()}`;
        }}
        value={selectedPetId}
      >
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {pet.name}
          </option>
        ))}
      </select>
    </label>
  );
}
