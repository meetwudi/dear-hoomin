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

export const listThoughtPublishedSubscriptionsForFamily = `
  select
    subscription.id,
    subscription.endpoint,
    subscription.p256dh,
    subscription.auth
  from public.family_memberships membership
  join public.push_subscriptions subscription
    on subscription.hoomin_id = membership.hoomin_id
  left join public.notification_preferences preference
    on preference.hoomin_id = membership.hoomin_id
  where membership.family_id = $1
    and coalesce(preference.all_enabled, true)
    and coalesce(preference.thought_published_enabled, true)
`;
