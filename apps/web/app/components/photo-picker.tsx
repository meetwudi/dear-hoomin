"use client";

import { useId, useState } from "react";
import { productCopy } from "../../lib/product-copy";
import { imageUploadAccept } from "../../lib/uploads/constants";

export function PhotoPicker({
  multiple = false,
  name,
  required = false,
}: {
  multiple?: boolean;
  name: string;
  required?: boolean;
}) {
  const inputId = useId();
  const emptySummary = multiple
    ? productCopy.photoPicker.noPhotosSelected
    : productCopy.photoPicker.noPhotoSelected;
  const [fileSummary, setFileSummary] = useState<string>(emptySummary);

  return (
    <div className="photo-picker">
      <input
        accept={imageUploadAccept}
        className="photo-picker-input"
        id={inputId}
        multiple={multiple}
        name={name}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);

          if (files.length === 0) {
            setFileSummary(emptySummary);
            return;
          }

          setFileSummary(
            files.length === 1
              ? files[0].name
              : productCopy.photoPicker.photosSelected(files.length),
          );
        }}
        required={required}
        type="file"
      />
      <label className="photo-picker-control" htmlFor={inputId}>
        <span className="photo-picker-button">
          {multiple ? productCopy.photoPicker.choosePhotos : productCopy.photoPicker.choosePhoto}
        </span>
        <span className="photo-picker-summary">{fileSummary}</span>
      </label>
      <p className="field-hint">{productCopy.photoPicker.acceptedFormats}</p>
    </div>
  );
}
