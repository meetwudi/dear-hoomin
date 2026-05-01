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
    return false;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(subscription.toJSON()),
  });

  return response.ok;
}

export function PushNotificationBootstrap({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !isPushSupported()) {
      return;
    }

    setPermission(Notification.permission);
  }, [isSignedIn]);

  if (!isSignedIn || permission === "unsupported" || permission === "denied") {
    return null;
  }

  const buttonLabel =
    permission === "granted" ? "Send test notification" : "Enable notifications";

  return (
    <button
      className="notification-test-button"
      onClick={async () => {
        setIsSending(true);

        try {
          if (Notification.permission !== "granted") {
            const nextPermission = await Notification.requestPermission();
            setPermission(nextPermission);

            if (nextPermission !== "granted") {
              return;
            }
          }

          await registerSubscription();
        } finally {
          setIsSending(false);
        }
      }}
      disabled={isSending}
      type="button"
    >
      {isSending ? "Sending..." : buttonLabel}
    </button>
  );
}
