import { type NextRequest } from "next/server";
import { getSession } from "../../../../lib/auth/session";
import {
  upsertPushSubscriptionForHoomin,
  type PushSubscriptionInput,
} from "../../../../lib/push/store";
import { sendTemporaryLoginTestNotification } from "../../../../lib/push/web-push";

// Platform note: update harness/platform-dependencies.md when Web Push changes.

export const runtime = "nodejs";

function parseSubscription(input: unknown): PushSubscriptionInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as {
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
    endpoint: candidate.endpoint,
    keys: {
      p256dh: candidate.keys.p256dh,
      auth: candidate.keys.auth,
    },
  };
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return Response.json({ success: false }, { status: 401 });
  }

  const subscription = parseSubscription(await request.json());

  if (!subscription) {
    return Response.json({ success: false }, { status: 400 });
  }

  const storedSubscription = await upsertPushSubscriptionForHoomin({
    hoominId: session.hoominId,
    subscription,
    userAgent: request.headers.get("user-agent"),
  });

  // TEMP: Login-time notification smoke test. Remove this send once real
  // notification triggers exist, but keep subscription registration.
  const notification = await sendTemporaryLoginTestNotification(storedSubscription);

  return Response.json({ success: true, notification });
}
