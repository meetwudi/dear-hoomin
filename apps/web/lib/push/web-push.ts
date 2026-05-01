import webPush from "web-push";
import { deletePushSubscriptionByEndpoint, type StoredPushSubscription } from "./store";

// Platform note: update harness/platform-dependencies.md when Web Push changes.

type VapidConfig = {
  subject: string;
  publicKey: string;
  privateKey: string;
};

function readVapidConfig(): VapidConfig | null {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return null;
  }

  return { subject, publicKey, privateKey };
}

export async function sendTemporaryLoginTestNotification(
  subscription: StoredPushSubscription,
) {
  const config = readVapidConfig();

  if (!config) {
    return { status: "missing_vapid_config" as const };
  }

  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: "Dear Hoomin",
        body: "Push notifications are wired up.",
        tag: "dear-hoomin-login-test",
        url: "/",
      }),
      {
        TTL: 60,
        urgency: "normal",
      },
    );

    return { status: "sent" as const };
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    if (statusCode === 404 || statusCode === 410) {
      await deletePushSubscriptionByEndpoint(subscription.endpoint);
      return { status: "expired_subscription" as const, code: statusCode };
    }

    return { status: "send_failed" as const, code: statusCode };
  }
}
