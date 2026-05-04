"use client";

import { useState } from "react";
import { productCopy } from "../../lib/product-copy";

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
      setStatus(productCopy.share.linkReady);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus(productCopy.share.linkCopied);
    } catch {
      setStatus(productCopy.share.linkCopyFailed);
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
        setStatus(productCopy.share.pictureNotReady);
        return;
      }

      const blob = await response.blob();
      const file = new File([blob], productCopy.share.fileName(petName), {
        type: "image/png",
      });
      const sharePayload = {
        files: [file],
        title: productCopy.share.title,
        text: productCopy.share.text(petName),
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
          {isSharing
            ? productCopy.share.preparingPictureButton
            : productCopy.share.pictureButton}
        </button>
        <button
          className="share-link secondary-share-link"
          disabled={isSharingLink}
          onClick={shareLink}
          type="button"
        >
          {isSharingLink ? productCopy.share.copyingButton : productCopy.share.linkButton}
        </button>
      </div>
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
