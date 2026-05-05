"use client";

import { useFormStatus } from "react-dom";
import { productCopy } from "../../lib/product-copy";

export function AvatarUploadPendingState() {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div
      aria-label={productCopy.avatars.loadingGridLabel}
      aria-live="polite"
      className="avatar-grid avatar-upload-pending-grid"
    >
      {[1, 2, 3].map((slot) => (
        <div className="avatar-loading-card" key={slot}>
          <div className="avatar-loading-skeleton" aria-hidden="true" />
          <small>{productCopy.avatars.loadingSlot(slot)}</small>
        </div>
      ))}
    </div>
  );
}
