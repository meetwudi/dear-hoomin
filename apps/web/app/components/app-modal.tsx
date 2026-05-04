"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { productCopy } from "../../lib/product-copy";

export function AppModal({
  children,
  labelledBy,
  onDismiss,
}: {
  children: ReactNode;
  labelledBy: string;
  onDismiss: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby={labelledBy}
      aria-modal="true"
      className="app-modal-backdrop"
      role="dialog"
    >
      <div className="app-modal-panel">
        {children}
        <button
          aria-label={productCopy.navigation.dismiss}
          className="app-modal-close"
          onClick={onDismiss}
          type="button"
        >
          ×
        </button>
      </div>
    </div>,
    document.body,
  );
}
