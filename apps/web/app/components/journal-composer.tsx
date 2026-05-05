"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type KeyboardEvent, useMemo, useState } from "react";
import { createJournalMusing } from "../../lib/client-api/journal-musings";
import { productCopy } from "../../lib/product-copy";
import { PhotoPicker } from "./photo-picker";

export type JournalComposerPet = {
  id: string;
  name: string;
};

export function JournalComposer({
  defaultPetId,
  familyId,
  pets,
}: {
  defaultPetId: string;
  familyId: string;
  pets: JournalComposerPet[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [, setLatestStage] = useState<string | null>(null);
  const [photoPickerKey, setPhotoPickerKey] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const defaultPet = pets.find((pet) => pet.id === defaultPetId) ?? pets[0];
  const notePlaceholder = useMemo(
    () => defaultPet ? pickNotePlaceholder(defaultPet.name) : "",
    [defaultPet],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const petIdValue = formData.get("petId");
    const journalTextValue = formData.get("journalText");

    if (typeof petIdValue !== "string") {
      setError(productCopy.home.journal.errors.fallback);
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      await createJournalMusing({
        familyId,
        petId: petIdValue,
        journalText:
          typeof journalTextValue === "string" && journalTextValue.trim()
            ? journalTextValue.trim()
            : null,
        photos: selectedPhotos,
      }, {
        onEvent: (event) => {
          setLatestStage(event.stage);
        },
      });
      form.reset();
      setSelectedPhotos([]);
      setPhotoPickerKey((currentKey) => currentKey + 1);
      router.refresh();
    } catch {
      setError(productCopy.home.journal.errors.fallback);
    } finally {
      setIsPending(false);
    }
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.dispatchEvent(
        new Event("submit", {
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  }

  if (!defaultPet) {
    return null;
  }

  return (
    <section
      id="journal"
      className="journal-composer"
      aria-label={productCopy.home.journal.ariaLabel}
    >
      <form className="journal-composer-form" onSubmit={handleSubmit}>
        {pets.length > 1 ? (
          <div className="journal-composer-topline">
            <label className="app-field pet-select-field">
              <span>{productCopy.home.journal.petLabel}</span>
              <select name="petId" defaultValue={defaultPet.id}>
                {pets.map((availablePet) => (
                  <option key={availablePet.id} value={availablePet.id}>
                    {availablePet.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <input name="petId" type="hidden" value={defaultPet.id} />
        )}
        <label className="app-field note-field compact-field">
          <span className="visually-hidden">{productCopy.home.journal.noteLabel}</span>
          <textarea
            aria-label={productCopy.home.journal.noteLabel}
            maxLength={1000}
            name="journalText"
            onKeyDown={handleTextareaKeyDown}
            placeholder={notePlaceholder}
            rows={3}
          />
        </label>
        <label className="app-field photo-field compact-field">
          <span className="visually-hidden">{productCopy.home.journal.photosLabel}</span>
          <PhotoPicker
            hideAcceptedFormats
            key={photoPickerKey}
            multiple
            name="photos"
            onFilesChange={setSelectedPhotos}
            required
            variant="tiles"
          />
        </label>
        <div className="journal-composer-actions">
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            aria-label={
              isPending
                ? productCopy.home.journal.pendingButton
                : productCopy.home.journal.submitAriaLabel
            }
            className="primary-button"
            disabled={isPending}
            type="submit"
          >
            {isPending
              ? productCopy.home.journal.pendingButton
              : productCopy.home.journal.submitButton}
          </button>
        </div>
      </form>
    </section>
  );
}

function pickNotePlaceholder(petName: string) {
  const options = productCopy.home.journal.notePlaceholders(petName);
  const hash = Array.from(petName).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return options[hash % options.length];
}
