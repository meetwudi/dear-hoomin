-- App-owned authentication tables.
-- These tables keep product identity portable and independent from Supabase Auth.

create table public.hoomins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hoomins_email_length check (char_length(email) between 3 and 320),
  constraint hoomins_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 120
  ),
  constraint hoomins_avatar_url_length check (
    avatar_url is null or char_length(avatar_url) <= 2048
  )
);

create trigger set_hoomins_updated_at
before update on public.hoomins
for each row execute function public.set_updated_at();

create table public.auth_accounts (
  id uuid primary key default gen_random_uuid(),
  hoomin_id uuid not null references public.hoomins(id) on delete cascade,
  provider text not null,
  provider_subject text not null,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  constraint auth_accounts_provider_check check (provider in ('google')),
  constraint auth_accounts_provider_subject_length check (
    char_length(provider_subject) between 1 and 320
  ),
  constraint auth_accounts_email_length check (char_length(email) between 3 and 320),
  constraint auth_accounts_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 120
  ),
  constraint auth_accounts_avatar_url_length check (
    avatar_url is null or char_length(avatar_url) <= 2048
  ),
  constraint auth_accounts_provider_subject_unique unique (provider, provider_subject),
  constraint auth_accounts_provider_hoomin_unique unique (provider, hoomin_id)
);

create index auth_accounts_hoomin_id_idx on public.auth_accounts (hoomin_id);

create trigger set_auth_accounts_updated_at
before update on public.auth_accounts
for each row execute function public.set_updated_at();
