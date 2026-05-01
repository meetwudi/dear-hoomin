"use client";

import { useState } from "react";

type ShareThoughtButtonProps = {
  cardUrl: string;
  petName: string;
  shareUrl: string;
};

export function ShareThoughtButton({
  cardUrl,
  petName,
  shareUrl,
}: ShareThoughtButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSharingLink, setIsSharingLink] = useState(false);

  async function copyLink() {
    if (!navigator.clipboard?.writeText) {
      setStatus("Link ready to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Link copied.");
    } catch {
      setStatus("Link could not be copied here.");
    }
  }

  function openPictureFallback() {
    window.location.assign(cardUrl);
  }

  async function sharePicture() {
    setIsSharing(true);

    try {
      setStatus(null);

      const response = await fetch(cardUrl);

      if (!response.ok) {
        setStatus("The share picture is not ready yet.");
        return;
      }

      const blob = await response.blob();
      const file = new File([blob], `${petName}-thought.png`, {
        type: "image/png",
      });
      const sharePayload = {
        files: [file],
        title: "Dear Hoomin",
        text: `what's ${petName} thinking?`,
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(sharePayload);
        return;
      }

      openPictureFallback();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      openPictureFallback();
    } finally {
      setIsSharing(false);
    }
  }

  async function shareLink() {
    setIsSharingLink(true);

    try {
      setStatus(null);
      await copyLink();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      await copyLink();
    } finally {
      setIsSharingLink(false);
    }
  }

  return (
    <div className="share-action">
      <div className="share-actions-row">
        <button
          className="share-link"
          disabled={isSharing}
          onClick={sharePicture}
          type="button"
        >
          {isSharing ? "Preparing picture..." : "Share picture"}
        </button>
        <button
          className="share-link secondary-share-link"
          disabled={isSharingLink}
          onClick={shareLink}
          type="button"
        >
          {isSharingLink ? "Copying..." : "Copy link"}
        </button>
      </div>
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
