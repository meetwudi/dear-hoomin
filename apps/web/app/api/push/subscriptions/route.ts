import { type NextRequest } from "next/server";
import { getSession } from "../../../../lib/auth/session";
import {
  upsertPushSubscriptionForHoomin,
  type PushSubscriptionInput,
} from "../../../../lib/push/store";
import { can } from "../../../../lib/permissions";
import { sendPushTestNotification } from "../../../../lib/push/web-push";

// Platform note: update harness/platform-dependencies.md when Web Push changes.

export const runtime = "nodejs";

function parseSubscription(input: unknown): PushSubscriptionInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as {
    clientId?: unknown;
    endpoint?: unknown;
    keys?: {
      p256dh?: unknown;
      auth?: unknown;
    };
  };

  if (
    typeof candidate.endpoint !== "string" ||
    typeof candidate.keys?.p256dh !== "string" ||
    typeof candidate.keys.auth !== "string"
  ) {
    return null;
  }

  return {
    clientId:
      typeof candidate.clientId === "string" &&
      candidate.clientId.length > 0 &&
      candidate.clientId.length <= 128
        ? candidate.clientId
        : null,
    endpoint: candidate.endpoint,
    keys: {
      p256dh: candidate.keys.p256dh,
      auth: candidate.keys.auth,
    },
  };
}

function shouldSendTest(input: unknown) {
  return Boolean(
    input &&
      typeof input === "object" &&
      "sendTest" in input &&
      input.sendTest === true,
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return Response.json({ success: false }, { status: 401 });
  }

  const body = (await request.json()) as unknown;
  const subscription = parseSubscription(body);

  if (!subscription) {
    return Response.json({ success: false }, { status: 400 });
  }

  const storedSubscription = await upsertPushSubscriptionForHoomin({
    hoominId: session.hoominId,
    subscription,
    userAgent: request.headers.get("user-agent"),
  });

  if (!shouldSendTest(body)) {
    return Response.json({
      success: true,
      subscription: "stored",
      notification: null,
    });
  }

  if (!can("push:test", { session })) {
    return Response.json({ success: false }, { status: 403 });
  }

  const notification = await sendPushTestNotification(storedSubscription);
  const didSend = notification.status === "sent";

  return Response.json(
    {
      success: didSend,
      subscription: "stored",
      notification,
    },
    { status: didSend ? 200 : 502 },
  );
}
