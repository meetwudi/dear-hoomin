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

  async function shareThought() {
    setIsSharing(true);

    try {
      setStatus(null);

      if (!navigator.share) {
        setStatus("Open this on iOS Safari or Chrome to use the share sheet.");
        return;
      }

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

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share(sharePayload);
        return;
      }

      await navigator.share({
        title: sharePayload.title,
        text: sharePayload.text,
        url: sharePayload.url,
      });
      setStatus("This browser shared the link, not the picture.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStatus("The share sheet could not open this picture.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="share-action">
      <button
        className="share-link"
        disabled={isSharing}
        onClick={shareThought}
        type="button"
      >
        {isSharing ? "Preparing picture..." : "Share picture"}
      </button>
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
