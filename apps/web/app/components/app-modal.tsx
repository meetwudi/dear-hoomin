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
  onDismiss?: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isMounted]);

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
        {onDismiss ? (
          <button
            aria-label={productCopy.navigation.dismiss}
            className="app-modal-close"
            onClick={onDismiss}
            type="button"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
