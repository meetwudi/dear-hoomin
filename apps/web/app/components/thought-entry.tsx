"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { deleteJournalMusing } from "../../lib/client-api/journal-musings";
import { productCopy } from "../../lib/product-copy";
import { ShareThoughtButton } from "./share-thought-button";

export type TimelineEntryKind = "daily" | "journal";

export type TimelineEntryMedia = {
  alt: string;
  cardUrl: string;
  entryUrl: string;
  kind: "generated" | "journal";
  src: string;
};

export type TimelineEntry = {
  hasGeneratedImage: boolean;
  imageGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  imageGenerationError: string | null;
  journalText: string | null;
  kind: TimelineEntryKind;
  mediaItems: TimelineEntryMedia[];
  musingId: string;
  petName: string;
  text: string;
};

export function TimelineEntryCard({
  entry,
  initialMediaIndex = 0,
  regenerateControl = null,
  showDeleteAction = false,
  showShareActions = true,
}: {
  entry: TimelineEntry;
  initialMediaIndex?: number;
  regenerateControl?: ReactNode;
  showDeleteAction?: boolean;
  showShareActions?: boolean;
}) {
  const router = useRouter();
  const initialIndex =
    initialMediaIndex >= 0 && initialMediaIndex < entry.mediaItems.length
      ? initialMediaIndex
      : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isDeleting, setIsDeleting] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const selectedMedia =
    entry.mediaItems[selectedIndex] ?? entry.mediaItems[0] ?? null;

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel || initialIndex === 0) {
      return;
    }

    carousel.scrollTo({ left: carousel.clientWidth * initialIndex, behavior: "instant" });
  }, [initialIndex]);

  useEffect(() => {
    if (entry.imageGenerationStatus !== "in_progress") {
      return;
    }

    const refreshTimer = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(refreshTimer);
  }, [entry.imageGenerationStatus, router]);

  function scrollToIndex(index: number) {
    const carousel = carouselRef.current;
    const clampedIndex = Math.max(0, Math.min(index, entry.mediaItems.length - 1));

    if (!carousel) {
      setSelectedIndex(clampedIndex);
      return;
    }

    carousel.scrollTo({
      left: carousel.clientWidth * clampedIndex,
      behavior: "smooth",
    });
    setSelectedIndex(clampedIndex);
  }

  function applyImageRatio(image: HTMLImageElement) {
    const ratio = image.naturalWidth / image.naturalHeight;

    if (ratio < 1) {
      image.style.height = "100%";
      image.style.width = `${ratio * 100}%`;
      return;
    }

    image.style.height = `${(1 / ratio) * 100}%`;
    image.style.width = "100%";
  }

  async function handleDeleteJournalMusing() {
    if (
      entry.kind !== "journal" ||
      !window.confirm(productCopy.timeline.deleteJournalConfirm(entry.petName))
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteJournalMusing(entry.musingId);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <article className="today-thought-entry">
      {entry.mediaItems.length > 0 ? (
        <div className="thought-media-shell">
          <div
            aria-label={productCopy.share.musingPicturesLabel(entry.petName)}
            className="thought-media-carousel"
            onScroll={(event) => {
              const carousel = event.currentTarget;
              const nextIndex = Math.round(
                carousel.scrollLeft / Math.max(carousel.clientWidth, 1),
              );

              if (nextIndex !== selectedIndex && entry.mediaItems[nextIndex]) {
                setSelectedIndex(nextIndex);
              }
            }}
            ref={carouselRef}
          >
            {entry.mediaItems.map((item) => (
              <div className="thought-media-slide" key={item.cardUrl}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={item.alt}
                  className={
                    item.kind === "journal"
                      ? "thought-media-image journal-media-image"
                      : "thought-media-image"
                  }
                  draggable={false}
                  onLoad={(event) => {
                    applyImageRatio(event.currentTarget);
                  }}
                  ref={(image) => {
                    if (image?.complete && image.naturalWidth && image.naturalHeight) {
                      applyImageRatio(image);
                    }
                  }}
                  src={item.src}
                />
              </div>
            ))}
          </div>
          {entry.mediaItems.length > 1 ? (
            <>
              <div className="thought-media-arrows">
                <button
                  aria-label={productCopy.share.previousPictureLabel}
                  disabled={selectedIndex === 0}
                  onClick={() => scrollToIndex(selectedIndex - 1)}
                  type="button"
                >
                  ‹
                </button>
                <button
                  aria-label={productCopy.share.nextPictureLabel}
                  disabled={selectedIndex === entry.mediaItems.length - 1}
                  onClick={() => scrollToIndex(selectedIndex + 1)}
                  type="button"
                >
                  ›
                </button>
              </div>
              <div
                className="thought-media-dots"
                aria-label={productCopy.share.pictureChoicesLabel}
              >
                {entry.mediaItems.map((item, index) => {
                  const journalPhotoNumber = entry.mediaItems
                    .slice(0, index + 1)
                    .filter((mediaItem) => mediaItem.kind === "journal").length;
                  const mediaLabel =
                    item.kind === "generated"
                      ? productCopy.share.generatedPictureLabel
                      : productCopy.share.journalPhotoLabel(journalPhotoNumber);

                  return (
                    <button
                      aria-label={productCopy.share.showMediaLabel(mediaLabel)}
                      aria-pressed={index === selectedIndex}
                      key={item.cardUrl}
                      onClick={() => scrollToIndex(index)}
                      type="button"
                    />
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : entry.imageGenerationStatus === "in_progress" ? (
        <div className="daily-visual thought-entry-visual cutie-picture-loading" aria-live="polite">
          <div className="cutie-loading-face" aria-hidden="true">
            <span />
          </div>
          <div className="loading-pill picture-loading-pill">
            <span className="loading-spinner" aria-hidden="true" />
            {productCopy.timeline.drawing}
          </div>
        </div>
      ) : null}
      <div className="thought-entry-content">
        {entry.imageGenerationStatus === "in_progress" ? (
          <p className="generation-status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            {productCopy.timeline.generationRunning}
          </p>
        ) : entry.imageGenerationStatus === "failed" ? (
          <div className="generation-status-block">
            <p className="generation-status generation-status-error">
              {productCopy.timeline.generationFailed}
              {entry.imageGenerationError ? ` ${entry.imageGenerationError}` : ""}
            </p>
            {regenerateControl}
          </div>
        ) : !entry.hasGeneratedImage && entry.imageGenerationStatus === "not_started" ? (
          <div className="generation-status-block">
            <p className="generation-status">
              {productCopy.timeline.generationNotStarted}
            </p>
            {regenerateControl}
          </div>
        ) : null}
        <p className="pet-thought">{entry.text}</p>
        {entry.journalText ? (
          <p className="journal-original-note">{entry.journalText}</p>
        ) : null}
        {showShareActions ? (
          <ShareThoughtButton
            cardUrl={selectedMedia?.cardUrl ?? null}
            isDeleting={isDeleting}
            onDelete={
              showDeleteAction && entry.kind === "journal"
                ? handleDeleteJournalMusing
                : undefined
            }
            petName={entry.petName}
            shareUrl={selectedMedia?.entryUrl ?? null}
          />
        ) : null}
      </div>
    </article>
  );
}
