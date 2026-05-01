-- Unguessable public thought sharing and view analytics.
-- Platform note: update harness/platform-dependencies.md when Supabase schema usage changes.

alter table public.daily_thoughts
  add column if not exists public_share_token text;

update public.daily_thoughts
set public_share_token = encode(gen_random_bytes(24), 'hex')
where public_share_token is null;

alter table public.daily_thoughts
  alter column public_share_token set not null;

create unique index if not exists daily_thoughts_public_share_token_idx
  on public.daily_thoughts (public_share_token);

create table if not exists public.public_thought_views (
  id uuid primary key default gen_random_uuid(),
  thought_id uuid not null references public.daily_thoughts(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  constraint public_thought_views_referrer_length check (
    referrer is null or char_length(referrer) <= 2048
  ),
  constraint public_thought_views_user_agent_length check (
    user_agent is null or char_length(user_agent) <= 1024
  )
);

create index if not exists public_thought_views_thought_id_viewed_at_idx
  on public.public_thought_views (thought_id, viewed_at desc);
