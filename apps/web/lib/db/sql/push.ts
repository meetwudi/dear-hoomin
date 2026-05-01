export const upsertPushSubscription = `
  insert into public.push_subscriptions (
    hoomin_id,
    endpoint,
    p256dh,
    auth,
    user_agent,
    updated_at,
    last_seen_at
  )
  values ($1, $2, $3, $4, $5, now(), now())
  on conflict (endpoint) do update
  set
    hoomin_id = excluded.hoomin_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    user_agent = excluded.user_agent,
    updated_at = now(),
    last_seen_at = now()
  returning id, endpoint, p256dh, auth
`;

export const deletePushSubscriptionByEndpoint = `
  delete from public.push_subscriptions
  where endpoint = $1
`;

