"use client";

import { useEffect, useState } from "react";
import { productCopy } from "../../lib/product-copy";
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
        <p className="eyebrow">{productCopy.homeScreenPrompt.eyebrow}</p>
        <h2 id="home-screen-heading">{productCopy.homeScreenPrompt.heading}</h2>
      </div>
      <ol className="home-screen-steps">
        {productCopy.homeScreenPrompt.steps.map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>
      <button className="primary-button" onClick={dismiss} type="button">
        {productCopy.homeScreenPrompt.dismissButton}
      </button>
    </AppModal>
  );
}
