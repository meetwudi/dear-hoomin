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

async function postSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...subscription.toJSON(),
      sendTest: true,
    }),
  });
  const result = (await response.json()) as RegistrationResult;

  return {
    ...result,
    success: response.ok && result.success,
  };
}

async function createSubscription({
  registration,
  publicKey,
  forceNew,
}: {
  registration: ServiceWorkerRegistration;
  publicKey: string;
  forceNew: boolean;
}) {
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription && forceNew) {
    await existingSubscription.unsubscribe();
  }

  if (existingSubscription && !forceNew) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

async function registerAndSendTest(): Promise<RegistrationResult> {
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
  const subscription = await createSubscription({
    registration,
    publicKey,
    forceNew: false,
  });
  const result = await postSubscription(subscription);

  if (
    result.notification?.status !== "send_failed" ||
    result.notification.code !== 403
  ) {
    return result;
  }

  const freshSubscription = await createSubscription({
    registration,
    publicKey,
    forceNew: true,
  });

  return postSubscription(freshSubscription);
}

export function AdminPushTest() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      return;
    }

    setPermission(Notification.permission);
  }, []);

  if (permission === "unsupported" || permission === "denied") {
    return (
      <p className="admin-status">
        Push notifications are {permission === "denied" ? "blocked" : "not supported"} in
        this browser.
      </p>
    );
  }

  const buttonLabel =
    permission === "granted" ? "Send test notification" : "Enable notifications";

  return (
    <div className="admin-tool">
      <button
        className="primary-button"
        disabled={isSending}
        onClick={async () => {
          setIsSending(true);

          try {
            if (Notification.permission !== "granted") {
              const nextPermission = await Notification.requestPermission();
              setPermission(nextPermission);

              if (nextPermission !== "granted") {
                setStatus("Permission was not granted.");
                return;
              }
            }

            const result = await registerAndSendTest();
            const notificationStatus = result.notification?.status ?? "unknown";

            setStatus(
              result.success
                ? "Test sent."
                : `Not sent: ${notificationStatus}${
                    result.notification?.code ? ` ${result.notification.code}` : ""
                  }`,
            );
          } finally {
            setIsSending(false);
          }
        }}
        type="button"
      >
        {isSending ? "Sending..." : buttonLabel}
      </button>
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}

