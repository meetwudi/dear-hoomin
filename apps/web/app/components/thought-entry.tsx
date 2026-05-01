"use client";

import { useEffect, useRef, useState } from "react";
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
  imageGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  journalText: string | null;
  kind: TimelineEntryKind;
  mediaItems: TimelineEntryMedia[];
  petName: string;
  text: string;
};

export function TimelineEntryCard({
  entry,
  initialMediaIndex = 0,
  showShareActions = true,
}: {
  entry: TimelineEntry;
  initialMediaIndex?: number;
  showShareActions?: boolean;
}) {
  const initialIndex =
    initialMediaIndex >= 0 && initialMediaIndex < entry.mediaItems.length
      ? initialMediaIndex
      : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
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

  return (
    <article className="today-thought-entry">
      {entry.mediaItems.length > 0 ? (
        <div className="thought-media-shell">
          <div
            aria-label={`${entry.petName} thought pictures`}
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
                  aria-label="Previous picture"
                  disabled={selectedIndex === 0}
                  onClick={() => scrollToIndex(selectedIndex - 1)}
                  type="button"
                >
                  ‹
                </button>
                <button
                  aria-label="Next picture"
                  disabled={selectedIndex === entry.mediaItems.length - 1}
                  onClick={() => scrollToIndex(selectedIndex + 1)}
                  type="button"
                >
                  ›
                </button>
              </div>
              <div className="thought-media-dots" aria-label="Picture choices">
                {entry.mediaItems.map((item, index) => {
                  const journalPhotoNumber = entry.mediaItems
                    .slice(0, index + 1)
                    .filter((mediaItem) => mediaItem.kind === "journal").length;
                  const mediaLabel =
                    item.kind === "generated"
                      ? "generated picture"
                      : `journal photo ${journalPhotoNumber}`;

                  return (
                    <button
                      aria-label={`Show ${mediaLabel}`}
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
            Drawing
          </div>
        </div>
      ) : null}
      <div className="thought-entry-content">
        <p className="pet-thought">{entry.text}</p>
        {entry.journalText ? (
          <p className="journal-original-note">{entry.journalText}</p>
        ) : null}
        {showShareActions && selectedMedia ? (
          <ShareThoughtButton
            cardUrl={selectedMedia.cardUrl}
            petName={entry.petName}
            shareUrl={selectedMedia.entryUrl}
          />
        ) : null}
      </div>
    </article>
  );
}
