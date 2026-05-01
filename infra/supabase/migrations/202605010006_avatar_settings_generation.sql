-- Avatar selection, app-managed style assets, and notification preferences.
-- Platform note: update harness/platform-dependencies.md when Supabase schema usage changes.

alter table public.uploaded_files
  drop constraint if exists uploaded_files_file_kind_check;

alter table public.uploaded_files
  add constraint uploaded_files_file_kind_check check (
    file_kind in (
      'pet_reference_photo',
      'pet_style_reference',
      'pet_avatar_candidate',
      'thought_image'
    )
  );

create table if not exists public.app_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  storage_bucket text not null default 'app-files',
  storage_path text not null,
  content_type text,
  uploaded_by uuid references public.hoomins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_assets_asset_key_length check (char_length(asset_key) between 1 and 120),
  constraint app_assets_storage_path_length check (char_length(storage_path) between 1 and 1024),
  constraint app_assets_unique_storage_object unique (storage_bucket, storage_path)
);

create trigger set_app_assets_updated_at
before update on public.app_assets
for each row execute function public.set_updated_at();

alter table public.pets
  add column if not exists selected_avatar_file_id uuid references public.uploaded_files(id) on delete set null,
  add column if not exists avatar_generation_status text not null default 'not_started',
  add column if not exists avatar_generation_error text,
  add column if not exists avatar_generation_started_at timestamptz,
  add column if not exists avatar_generation_completed_at timestamptz;

alter table public.pets
  drop constraint if exists pets_avatar_generation_status_check;

alter table public.pets
  add constraint pets_avatar_generation_status_check check (
    avatar_generation_status in ('not_started', 'in_progress', 'succeeded', 'failed')
  );

create table if not exists public.pet_avatar_candidates (
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

create index if not exists pet_avatar_candidates_pet_id_idx
  on public.pet_avatar_candidates (pet_id, created_at desc);

create index if not exists pet_avatar_candidates_generation_group_id_idx
  on public.pet_avatar_candidates (generation_group_id);

create table if not exists public.notification_preferences (
  hoomin_id uuid primary key references public.hoomins(id) on delete cascade,
  all_enabled boolean not null default true,
  thought_published_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();
