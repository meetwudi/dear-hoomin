"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

function isPushSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function registerSubscription() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey || !isPushSupported() || Notification.permission !== "granted") {
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(subscription.toJSON()),
  });
}

export function PushNotificationBootstrap({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) {
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !isPushSupported()) {
      return;
    }

    if (Notification.permission === "granted") {
      void registerSubscription();
      return;
    }

    setCanPrompt(Notification.permission === "default");
  }, [isSignedIn]);

  if (!isSignedIn || !canPrompt) {
    return null;
  }

  return (
    <button
      className="notification-test-button"
      onClick={async () => {
        const permission = await Notification.requestPermission();
        setCanPrompt(false);

        if (permission === "granted") {
          await registerSubscription();
        }
      }}
      type="button"
    >
      Enable notifications
    </button>
  );
}

