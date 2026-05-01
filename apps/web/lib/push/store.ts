import { getPool } from "../db/client";
import * as pushSql from "../db/sql/push";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type StoredPushSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function upsertPushSubscriptionForHoomin({
  hoominId,
  subscription,
  userAgent,
}: {
  hoominId: string;
  subscription: PushSubscriptionInput;
  userAgent: string | null;
}) {
  const result = await getPool().query<PushSubscriptionRow>(
    pushSql.upsertPushSubscription,
    [
      hoominId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      userAgent,
    ],
  );
  const row = result.rows[0];

  if (!row) {
    throw new Error("push_subscription_upsert_failed");
  }

  return {
    id: row.id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
  };
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  await getPool().query(pushSql.deletePushSubscriptionByEndpoint, [endpoint]);
}

