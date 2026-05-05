"use client";

import { useState } from "react";
import { productCopy } from "../../lib/product-copy";

type ShareThoughtButtonProps = {
  cardUrl: string | null;
  isDeleting?: boolean;
  onDelete?: () => void;
  petName: string;
  shareUrl: string | null;
};

export function ShareThoughtButton({
  cardUrl,
  isDeleting = false,
  onDelete,
  petName,
  shareUrl,
}: ShareThoughtButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSharingLink, setIsSharingLink] = useState(false);

  async function copyLink() {
    if (!shareUrl) {
      return;
    }

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
    if (!cardUrl) {
      return;
    }

    window.location.assign(cardUrl);
  }

  async function sharePicture() {
    if (!cardUrl || !shareUrl) {
      return;
    }

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
    <details className="entry-actions">
      <summary aria-label={productCopy.timeline.entryActionsLabel}>
        <span aria-hidden="true">...</span>
      </summary>
      <div className="entry-actions-menu">
        {cardUrl && shareUrl ? (
          <>
            <button
              className="entry-action-item"
              disabled={isSharing}
              onClick={sharePicture}
              type="button"
            >
              {isSharing
                ? productCopy.share.preparingPictureButton
                : productCopy.share.pictureButton}
            </button>
            <button
              className="entry-action-item"
              disabled={isSharingLink}
              onClick={shareLink}
              type="button"
            >
              {isSharingLink ? productCopy.share.copyingButton : productCopy.share.linkButton}
            </button>
          </>
        ) : null}
        {onDelete ? (
          <button
            className="entry-action-item danger-entry-action-item"
            disabled={isDeleting}
            onClick={onDelete}
            type="button"
          >
            {isDeleting ? productCopy.timeline.deleting : productCopy.timeline.deleteJournalButton}
          </button>
        ) : null}
      </div>
      {status ? <p className="admin-status">{status}</p> : null}
    </details>
  );
}
