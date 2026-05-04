"use client";

import { useId, useRef, useState } from "react";
import { productCopy } from "../../lib/product-copy";

export function CopyInviteLink({ inviteUrl }: { inviteUrl: string }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  async function copyInviteLink() {
    setIsCopying(true);
    setStatus(null);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        inputRef.current?.select();
        document.execCommand("copy");
      }

      setStatus(productCopy.inviteLink.copiedStatus);
    } catch {
      inputRef.current?.select();
      setStatus(productCopy.inviteLink.readyStatus);
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className="copy-invite-link">
      <label className="copy-field" htmlFor={inputId}>
        {productCopy.inviteLink.label}
        <input
          id={inputId}
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          ref={inputRef}
          value={inviteUrl}
        />
      </label>
      <button
        className="share-link secondary-share-link"
        disabled={isCopying}
        onClick={copyInviteLink}
        type="button"
      >
        {isCopying ? productCopy.share.copyingButton : productCopy.inviteLink.copyButton}
      </button>
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
