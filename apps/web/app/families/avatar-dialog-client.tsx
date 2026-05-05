"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AppModal } from "../components/app-modal";

export function AvatarDialogClient({
  buttonLabel,
  children,
}: {
  buttonLabel: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="text-button compact-action"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {buttonLabel}
      </button>
      {isOpen ? (
        <AppModal
          labelledBy="avatar-heading"
          onDismiss={() => setIsOpen(false)}
        >
          {children}
        </AppModal>
      ) : null}
    </>
  );
}
