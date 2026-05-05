"use client";

import { useRef, useState } from "react";
import { productCopy } from "../../lib/product-copy";

type HoominMusingNameEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  currentName: string | null;
  displayName: string;
  familyId: string;
  redirectTo: string;
  subjectId: string;
};

export function HoominMusingNameEditor({
  action,
  currentName,
  displayName,
  familyId,
  redirectTo,
  subjectId,
}: HoominMusingNameEditorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const normalizedCurrentName = currentName?.trim() ?? "";
  const displayValue =
    normalizedCurrentName || productCopy.family.musingNameFallback;

  function finishEditing() {
    const nextValue = inputRef.current?.value.trim() ?? "";

    if (nextValue === normalizedCurrentName) {
      setIsEditing(false);
      return;
    }

    formRef.current?.requestSubmit();
  }

  if (!isEditing) {
    return (
      <button
        aria-label={productCopy.family.editMusingNameLabel(displayName)}
        className="member-musing-name"
        onClick={() => setIsEditing(true)}
        type="button"
      >
        ({displayValue})
      </button>
    );
  }

  return (
    <form
      action={action}
      className="member-musing-name-form"
      ref={formRef}
    >
      <input name="familyId" type="hidden" value={familyId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <input name="subjectId" type="hidden" value={subjectId} />
      <input name="displayName" type="hidden" value={displayName} />
      <label className="visually-hidden" htmlFor={`musing-name-${subjectId}`}>
        {productCopy.family.musingNameLabel}
      </label>
      <input
        aria-label={productCopy.family.musingNameLabel}
        autoFocus
        defaultValue={normalizedCurrentName}
        id={`musing-name-${subjectId}`}
        list="hoomin-musing-name-suggestions"
        maxLength={40}
        name="referenceName"
        onBlur={finishEditing}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            finishEditing();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setIsEditing(false);
          }
        }}
        placeholder={productCopy.family.musingNamePlaceholder}
        ref={inputRef}
      />
    </form>
  );
}
