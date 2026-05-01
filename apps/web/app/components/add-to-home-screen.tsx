"use client";

import { useEffect, useState } from "react";

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

export function AddToHomeScreen() {
  const [canShowInstallHelp, setCanShowInstallHelp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCanShowInstallHelp(isIOS() && !isStandalone());
  }, []);

  if (!canShowInstallHelp) {
    return null;
  }

  return (
    <>
      <button
        className="text-button install-app-button"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Install
      </button>
      {isOpen ? (
        <div
          aria-labelledby="install-app-heading"
          aria-modal="true"
          className="install-app-backdrop"
          role="dialog"
        >
          <div className="install-app-panel">
            <div>
              <p className="eyebrow">iPhone app</p>
              <h2 id="install-app-heading">Add Dear Hoomin</h2>
            </div>
            <ol className="install-steps">
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
            <button
              className="primary-button"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
