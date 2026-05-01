"use client";

import type { ReactNode } from "react";

export function AppModal({
  children,
  labelledBy,
  onDismiss,
}: {
  children: ReactNode;
  labelledBy: string;
  onDismiss: () => void;
}) {
  return (
    <div
      aria-labelledby={labelledBy}
      aria-modal="true"
      className="app-modal-backdrop"
      role="dialog"
    >
      <div className="app-modal-panel">
        {children}
        <button
          aria-label="Dismiss"
          className="app-modal-close"
          onClick={onDismiss}
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}
