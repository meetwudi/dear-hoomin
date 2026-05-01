export const findAuthAccount = `
  select
    hoomins.id,
    hoomins.email,
    hoomins.display_name,
    hoomins.avatar_url
  from public.auth_accounts account
  join public.hoomins hoomins on hoomins.id = account.hoomin_id
  where account.provider = $1
    and account.provider_subject = $2
  limit 1
`;

export const upsertHoominByEmail = `
  insert into public.hoomins (email, display_name, avatar_url)
  values ($1, $2, $3)
  on conflict (email) do update
  set
    display_name = coalesce(excluded.display_name, public.hoomins.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.hoomins.avatar_url)
  returning id, email, display_name, avatar_url
`;

export const upsertAuthAccount = `
  insert into public.auth_accounts (
    hoomin_id,
    provider,
    provider_subject,
    email,
    display_name,
    avatar_url,
    last_login_at
  )
  values ($1, $2, $3, $4, $5, $6, now())
  on conflict (provider, provider_subject) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    last_login_at = now()
`;

export const updateHoominProfileFromProvider = `
  update public.hoomins
  set
    email = $2,
    display_name = coalesce($3, display_name),
    avatar_url = coalesce($4, avatar_url)
  where id = $1
`;
