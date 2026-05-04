"use client";

import { useEffect, useState } from "react";
import {
  getPushClientId,
  getPushSubscription,
  isPushSupported,
} from "../../lib/push/browser";
import { productCopy } from "../../lib/product-copy";

type RegistrationResult = {
  success: boolean;
  subscription?: string;
  notification?: {
    status: string;
    code?: number | null;
  };
};

async function postSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...subscription.toJSON(),
      clientId: getPushClientId(),
      sendTest: true,
    }),
  });
  const result = (await response.json()) as RegistrationResult;

  return {
    ...result,
    success: response.ok && result.success,
  };
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
  const subscription = await getPushSubscription({
    registration,
    publicKey,
  });
  const result = await postSubscription(subscription);

  return result;
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
        {productCopy.admin.pushUnsupportedOrDenied(permission)}
      </p>
    );
  }

  const buttonLabel =
    permission === "granted"
      ? productCopy.admin.sendTestNotificationButton
      : productCopy.admin.enableNotificationsButton;

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
                setStatus(productCopy.admin.permissionNotGranted);
                return;
              }
            }

            const result = await registerAndSendTest();
            const notificationStatus = result.notification?.status ?? "unknown";

            setStatus(
              result.success
                ? productCopy.admin.testSent
                : productCopy.admin.testNotSent(
                    notificationStatus,
                    result.notification?.code,
                  ),
            );
          } finally {
            setIsSending(false);
          }
        }}
        type="button"
      >
        {isSending ? productCopy.admin.sendingButton : buttonLabel}
      </button>
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
