"use client";

import { useEffect, useState } from "react";

type RegistrationResult = {
  success: boolean;
  subscription?: string;
  notification?: {
    status: string;
    code?: number | null;
  };
};

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

async function registerSubscription(): Promise<RegistrationResult> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return { success: false, notification: { status: "missing_public_key" } };
  }

  if (!isPushSupported()) {
    return { success: false, notification: { status: "push_not_supported" } };
  }

  if (Notification.permission !== "granted") {
    return { success: false, notification: { status: "permission_not_granted" } };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
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

  const result = (await response.json()) as RegistrationResult;

  return {
    ...result,
    success: response.ok && result.success,
  };
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
  const [status, setStatus] = useState<string | null>(null);

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

          const result = await registerSubscription();
          const notificationStatus = result.notification?.status ?? "unknown";

          setStatus(
            result.success
              ? "Test sent"
              : `Not sent: ${notificationStatus}${
                  result.notification?.code ? ` ${result.notification.code}` : ""
                }`,
          );
        } finally {
          setIsSending(false);
        }
      }}
      disabled={isSending}
      type="button"
    >
      {isSending ? "Sending..." : buttonLabel}
      {status ? <span>{status}</span> : null}
    </button>
  );
}
