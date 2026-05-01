export const getNotificationPreferences = `
  insert into public.notification_preferences (hoomin_id)
  values ($1)
  on conflict (hoomin_id) do update
  set hoomin_id = excluded.hoomin_id
  returning all_enabled, thought_published_enabled
`;

export const updateNotificationPreferences = `
  insert into public.notification_preferences (
    hoomin_id,
    all_enabled,
    thought_published_enabled
  )
  values ($1, $2, $3)
  on conflict (hoomin_id) do update
  set
    all_enabled = excluded.all_enabled,
    thought_published_enabled = excluded.thought_published_enabled,
    updated_at = now()
  returning all_enabled, thought_published_enabled
`;
