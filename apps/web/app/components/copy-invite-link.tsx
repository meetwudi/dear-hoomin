"use client";

import { useId, useRef, useState } from "react";

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

      setStatus("Invite link copied.");
    } catch {
      inputRef.current?.select();
      setStatus("Link ready to copy.");
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className="copy-invite-link">
      <label className="copy-field" htmlFor={inputId}>
        Latest invite link
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
        {isCopying ? "Copying..." : "Copy invite link"}
      </button>
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
