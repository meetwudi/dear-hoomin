"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type PendingSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel: string;
};

export function PendingSubmitButton({
  children,
  className = "primary-button",
  disabled = false,
  pendingLabel,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
