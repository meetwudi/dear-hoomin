"use client";

import { useEffect, useState } from "react";
import {
  getPushSubscription,
  isPushSupported,
} from "../../lib/push/browser";

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
    return <p className="admin-status">This browser cannot do little nudges yet.</p>;
  }

  return (
    <div className="admin-tool">
      <button
        className="primary-button"
        onClick={async () => {
          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (!publicKey) {
            setStatus("Notifications are missing their public key.");
            return;
          }

          const nextPermission =
            Notification.permission === "granted"
              ? "granted"
              : await Notification.requestPermission();
          setPermission(nextPermission);

          if (nextPermission !== "granted") {
            setStatus("No worries. Tiny nudges are off in this browser.");
            return;
          }

          const registration = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          const subscription = await getPushSubscription({ registration, publicKey });
          const response = await fetch("/api/push/subscriptions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(subscription.toJSON()),
          });
          const result = (await response.json()) as RegistrationResult;

          setStatus(
            response.ok && result.success
              ? "Tiny nudges are ready for this browser."
              : "Could not enable nudges here yet.",
          );
        }}
        type="button"
      >
        {permission === "granted" ? "Refresh browser nudges" : "Enable browser nudges"}
      </button>
      {permission === "denied" ? (
        <p className="admin-status">Notifications are blocked in browser settings.</p>
      ) : null}
      {status ? <p className="admin-status">{status}</p> : null}
    </div>
  );
}
