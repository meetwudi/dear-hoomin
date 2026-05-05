"use client";

import { useEffect, useState } from "react";
import { productCopy } from "../../lib/product-copy";
import { AppModal } from "./app-modal";

const previewSearchParam = "showHomeScreenPrompt";
const localPreviewHosts = new Set(["localhost", "127.0.0.1", "::1"]);

// Cross-platform exception: Safari home-screen installation is a web-only browser
// surface; mobile clients own their own install/distribution path.
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isSafariOnIOS() {
  const platform = window.navigator.platform.toLowerCase();
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isTouchMac =
    platform === "macintel" && window.navigator.maxTouchPoints > 1;
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
  const isSafari =
    /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

  return isIOSDevice && isSafari;
}

function shouldForcePreview() {
  return (
    localPreviewHosts.has(window.location.hostname) &&
    new URLSearchParams(window.location.search).get(previewSearchParam) === "1"
  );
}

export function AddToHomeScreen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(shouldForcePreview() || (isSafariOnIOS() && !isStandalone()));
  }, []);

  if (!isOpen) {
    return null;
  }

  function dismiss() {
    setIsOpen(false);
  }

  return (
    <AppModal labelledBy="home-screen-heading" onDismiss={dismiss}>
      <div>
        <p className="eyebrow">{productCopy.homeScreenPrompt.eyebrow}</p>
        <h2 id="home-screen-heading">{productCopy.homeScreenPrompt.heading}</h2>
        <p className="home-screen-intro">{productCopy.homeScreenPrompt.intro}</p>
      </div>
      <ol className="home-screen-steps">
        {productCopy.homeScreenPrompt.steps.map((step) => (
          <li key={step.title}>
            <div>
              <strong>{step.title}</strong>
              <span className="home-screen-step-body">{step.body}</span>
            </div>
          </li>
        ))}
      </ol>
      <button className="primary-button" onClick={dismiss} type="button">
        {productCopy.homeScreenPrompt.dismissButton}
      </button>
    </AppModal>
  );
}
