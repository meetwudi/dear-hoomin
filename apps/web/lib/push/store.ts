import { getPool } from "../db/client";
import * as pushSql from "../db/sql/push";
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "../db/sql/transactions";

export type PushSubscriptionInput = {
  clientId: string | null;
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
  const client = await getPool().connect();

  try {
    await client.query(beginTransaction);
    await client.query(pushSql.deleteStalePushSubscriptionsForClient, [
      hoominId,
      subscription.endpoint,
      subscription.clientId,
      userAgent,
    ]);

    const result = await client.query<PushSubscriptionRow>(
      pushSql.upsertPushSubscription,
      [
        hoominId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        userAgent,
        subscription.clientId,
      ],
    );
    const row = result.rows[0];

    if (!row) {
      throw new Error("push_subscription_upsert_failed");
    }

    await client.query(commitTransaction);

    return {
      id: row.id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
    };
  } catch (error) {
    await client.query(rollbackTransaction);
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  await getPool().query(pushSql.deletePushSubscriptionByEndpoint, [endpoint]);
}

export async function listThoughtPublishedSubscriptionsForFamily(
  familyId: string,
) {
  const result = await getPool().query<PushSubscriptionRow>(
    pushSql.listThoughtPublishedSubscriptionsForFamily,
    [familyId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
  }));
}
