"use client";

import { useEffect, useState } from "react";
import { AppModal } from "./app-modal";

const dismissedStorageKey = "dear-hoomin:add-to-home-screen-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIOS() {
  const platform = window.navigator.platform.toLowerCase();
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isTouchMac =
    platform === "macintel" && window.navigator.maxTouchPoints > 1;

  return /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(dismissedStorageKey) === "true";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(dismissedStorageKey, "true");
  } catch {
    // Ignore storage failures; dismiss for the current view at least.
  }
}

export function AddToHomeScreen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(isIOS() && !isStandalone() && !wasDismissed());
  }, []);

  function dismiss() {
    rememberDismissed();
    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <AppModal labelledBy="home-screen-heading" onDismiss={dismiss}>
      <div>
        <p className="eyebrow">iPhone app</p>
        <h2 id="home-screen-heading">Add Dear Hoomin to Home Screen</h2>
      </div>
      <ol className="home-screen-steps">
        <li>
          <strong>Tap Share</strong>
          <span>Use Safari&apos;s share button.</span>
        </li>
        <li>
          <strong>Add to Home Screen</strong>
          <span>Scroll the sheet if it is lower down.</span>
        </li>
        <li>
          <strong>Tap Add</strong>
          <span>Dear Hoomin opens like an app next time.</span>
        </li>
      </ol>
      <button className="primary-button" onClick={dismiss} type="button">
        Got it
      </button>
    </AppModal>
  );
}
