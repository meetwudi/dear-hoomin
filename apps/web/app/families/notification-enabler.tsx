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
};

export function NotificationEnabler() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isPushSupported()) {
      setPermission(Notification.permission);
    }
  }, []);

  if (permission === "unsupported") {
    return <p className="admin-status">{productCopy.notifications.unsupported}</p>;
  }

  return (
    <div className="admin-tool">
      <button
        className="primary-button"
        onClick={async () => {
          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (!publicKey) {
            setStatus(productCopy.notifications.missingPublicKey);
            return;
          }

          const nextPermission =
            Notification.permission === "granted"
              ? "granted"
              : await Notification.requestPermission();
          setPermission(nextPermission);

          if (nextPermission !== "granted") {
            setStatus(productCopy.notifications.deniedSoft);
            return;
          }

          const registration = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          const subscription = await getPushSubscription({
            registration,
            publicKey,
          });
          const response = await fetch("/api/push/subscriptions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              ...subscription.toJSON(),
              clientId: getPushClientId(),
            }),
          });
          const result = (await response.json()) as RegistrationResult;

          setStatus(
            response.ok && result.success
              ? productCopy.notifications.ready
              : productCopy.notifications.enableFailed,
          );
        }}
        type="button"
      >
        {permission === "granted"
          ? productCopy.notifications.refreshButton
          : productCopy.notifications.enableButton}
      </button>
      {permission === "denied" ? (
        <p className="admin-status">{productCopy.notifications.blocked}</p>
      ) : null}
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
