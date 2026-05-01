"use client";

import { useId, useState } from "react";
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
  const emptySummary = multiple ? "No photos selected" : "No photo selected";
  const [fileSummary, setFileSummary] = useState(emptySummary);

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
            files.length === 1 ? files[0].name : `${files.length} photos selected`,
          );
        }}
        required={required}
        type="file"
      />
      <label className="photo-picker-control" htmlFor={inputId}>
        <span className="photo-picker-button">
          {multiple ? "Choose photos" : "Choose photo"}
        </span>
        <span className="photo-picker-summary">{fileSummary}</span>
      </label>
      <p className="field-hint">JPEG, PNG, WebP, HEIC</p>
    </div>
  );
}
