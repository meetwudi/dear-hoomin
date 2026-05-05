"use client";

import { useEffect, useId, useState } from "react";
import { productCopy } from "../../lib/product-copy";
import { imageUploadAccept } from "../../lib/uploads/constants";

export function PhotoPicker({
  hideAcceptedFormats = false,
  multiple = false,
  name,
  onFilesChange,
  required = false,
  variant = "default",
}: {
  hideAcceptedFormats?: boolean;
  multiple?: boolean;
  name: string;
  onFilesChange?: (files: File[]) => void;
  required?: boolean;
  variant?: "default" | "tiles";
}) {
  const inputId = useId();
  const emptySummary = multiple
    ? productCopy.photoPicker.noPhotosSelected
    : productCopy.photoPicker.noPhotoSelected;
  const [fileSummary, setFileSummary] = useState<string>(emptySummary);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));

    setPreviewUrls(urls);

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [selectedFiles]);

  const isTilePicker = variant === "tiles";

  return (
    <div className={isTilePicker ? "photo-picker photo-picker-tiles" : "photo-picker"}>
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
            setSelectedFiles([]);
            onFilesChange?.([]);
            return;
          }

          setSelectedFiles(files);
          onFilesChange?.(files);
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
          {isTilePicker ? "+" : multiple ? productCopy.photoPicker.choosePhotos : productCopy.photoPicker.choosePhoto}
        </span>
        {isTilePicker ? (
          <span className="photo-picker-summary">
            {selectedFiles.length > 0
              ? productCopy.photoPicker.addMore
              : productCopy.photoPicker.addPhotos}
          </span>
        ) : (
          <span className="photo-picker-summary">{fileSummary}</span>
        )}
      </label>
      {isTilePicker && previewUrls.length > 0 ? (
        <div className="photo-picker-previews" aria-label={productCopy.photoPicker.selectedPhotosLabel}>
          {selectedFiles.map((file, index) => (
            <div className="photo-picker-preview" key={`${file.name}-${file.lastModified}-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={productCopy.photoPicker.selectedPhotoAlt(index)}
                src={previewUrls[index] ?? ""}
              />
            </div>
          ))}
        </div>
      ) : null}
      {!hideAcceptedFormats ? (
        <p className="field-hint">{productCopy.photoPicker.acceptedFormats}</p>
      ) : null}
    </div>
  );
}
