-- Dear Hoomin current baseline schema.
-- Source of truth for app-owned auth, families, pets, generated thoughts,
-- notification preferences, push subscriptions, public sharing, and provider-neutral object metadata.

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.hoomins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  avatar_url text,
  time_zone text not null default 'America/Los_Angeles',
  thought_generation_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hoomins_email_length check (char_length(email) between 3 and 320),
  constraint hoomins_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 120
  ),
  constraint hoomins_avatar_url_length check (
    avatar_url is null or char_length(avatar_url) <= 2048
  ),
  constraint hoomins_time_zone_length check (
    char_length(time_zone) between 1 and 80
  ),
  constraint hoomins_thought_generation_instructions_length check (
    thought_generation_instructions is null or char_length(thought_generation_instructions) <= 1000
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

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.hoomins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint families_name_length check (char_length(name) between 1 and 100)
);

create trigger set_families_updated_at
before update on public.families
for each row execute function public.set_updated_at();

create table public.family_memberships (
  family_id uuid not null references public.families(id) on delete cascade,
  hoomin_id uuid not null references public.hoomins(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (family_id, hoomin_id),
  constraint family_memberships_role_check check (role in ('owner', 'member'))
);

create index family_memberships_hoomin_id_idx on public.family_memberships (hoomin_id);

create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invite_token text not null unique,
  email text,
  created_by uuid references public.hoomins(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references public.hoomins(id) on delete set null,
  constraint family_invites_token_length check (char_length(invite_token) >= 24),
  constraint family_invites_email_length check (email is null or char_length(email) <= 320)
);

create index family_invites_family_id_idx on public.family_invites (family_id);
create index family_invites_accepted_by_idx on public.family_invites (accepted_by);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  species text,
  time_zone text,
  created_by uuid references public.hoomins(id) on delete set null,
  selected_avatar_file_id uuid,
  avatar_generation_status text not null default 'not_started',
  avatar_generation_error text,
  avatar_generation_started_at timestamptz,
  avatar_generation_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pets_name_length check (char_length(name) between 1 and 80),
  constraint pets_species_length check (species is null or char_length(species) <= 80),
  constraint pets_time_zone_length check (time_zone is null or char_length(time_zone) <= 80),
  constraint pets_avatar_generation_status_check check (
    avatar_generation_status in ('not_started', 'in_progress', 'succeeded', 'failed')
  )
);

create index pets_family_id_idx on public.pets (family_id);

create trigger set_pets_updated_at
before update on public.pets
for each row execute function public.set_updated_at();

create table public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner_type text not null,
  owner_id uuid not null,
  file_kind text not null,
  object_key text not null,
  content_type text,
  uploaded_by uuid references public.hoomins(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint uploaded_files_owner_type_check check (owner_type in ('pet', 'daily_thought', 'family')),
  constraint uploaded_files_file_kind_check check (
    file_kind in (
      'pet_reference_photo',
      'pet_style_reference',
      'pet_avatar_candidate',
      'thought_image',
      'journal_photo'
    )
  ),
  constraint uploaded_files_object_key_length check (char_length(object_key) between 1 and 1024),
  constraint uploaded_files_unique_object_key unique (object_key)
);

create index uploaded_files_family_id_idx on public.uploaded_files (family_id);
create index uploaded_files_owner_idx on public.uploaded_files (owner_type, owner_id);

alter table public.pets
  add constraint pets_selected_avatar_file_id_fkey
  foreign key (selected_avatar_file_id) references public.uploaded_files(id) on delete set null;

create table public.app_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  object_key text not null,
  content_type text,
  uploaded_by uuid references public.hoomins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_assets_asset_key_length check (char_length(asset_key) between 1 and 120),
  constraint app_assets_object_key_length check (char_length(object_key) between 1 and 1024),
  constraint app_assets_unique_object_key unique (object_key)
);

create trigger set_app_assets_updated_at
before update on public.app_assets
for each row execute function public.set_updated_at();

create table public.pet_avatar_candidates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  file_id uuid not null references public.uploaded_files(id) on delete cascade,
  generation_group_id uuid not null,
  instructions text,
  prompt text,
  created_by uuid references public.hoomins(id) on delete set null,
  selected_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pet_avatar_candidates_instructions_length check (
    instructions is null or char_length(instructions) <= 1000
  )
);

create index pet_avatar_candidates_pet_id_idx
  on public.pet_avatar_candidates (pet_id, created_at desc);

create index pet_avatar_candidates_generation_group_id_idx
  on public.pet_avatar_candidates (generation_group_id);

create table public.daily_thoughts (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  local_date date not null,
  source text not null default 'daily',
  text text not null,
  journal_text text,
  created_by uuid references public.hoomins(id) on delete set null,
  public_share_token text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  image_file_id uuid references public.uploaded_files(id) on delete set null,
  image_generation_status text not null default 'not_started',
  image_generation_prompt text,
  image_generation_error text,
  image_generation_started_at timestamptz,
  image_generation_completed_at timestamptz,
  generator_version text not null default 'mock-v1',
  created_at timestamptz not null default now(),
  constraint daily_thoughts_text_length check (char_length(text) between 1 and 200),
  constraint daily_thoughts_source_check check (source in ('daily', 'journal')),
  constraint daily_thoughts_journal_text_length check (
    journal_text is null or char_length(journal_text) <= 1000
  ),
  constraint daily_thoughts_image_generation_status_check check (
    image_generation_status in ('not_started', 'in_progress', 'succeeded', 'failed')
  )
);

create index daily_thoughts_pet_id_local_date_idx
  on public.daily_thoughts (pet_id, local_date desc);

create unique index daily_thoughts_one_daily_per_pet_per_day_idx
  on public.daily_thoughts (pet_id, local_date)
  where source = 'daily';

create unique index daily_thoughts_public_share_token_idx
  on public.daily_thoughts (public_share_token);

create table public.public_thought_views (
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

create index public_thought_views_thought_id_viewed_at_idx
  on public.public_thought_views (thought_id, viewed_at desc);

create table public.notification_preferences (
  hoomin_id uuid primary key references public.hoomins(id) on delete cascade,
  all_enabled boolean not null default true,
  thought_published_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  hoomin_id uuid not null references public.hoomins(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  client_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint push_subscriptions_client_id_length check (
    client_id is null or char_length(client_id) <= 128
  )
);

create unique index push_subscriptions_hoomin_client_id_idx
  on public.push_subscriptions (hoomin_id, client_id)
  where client_id is not null;
