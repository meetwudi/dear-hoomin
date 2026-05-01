-- Dear Hoomin MVP initial schema.
-- Source of truth for families, hoomins, pets, invite links, uploaded files, daily thoughts, storage buckets, and basic RLS.

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

create table public.hoomin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hoomin_profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  )
);

create trigger set_hoomin_profiles_updated_at
before update on public.hoomin_profiles
for each row execute function public.set_updated_at();

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint families_name_length check (char_length(name) between 1 and 100)
);

create trigger set_families_updated_at
before update on public.families
for each row execute function public.set_updated_at();

create table public.family_memberships (
  family_id uuid not null references public.families(id) on delete cascade,
  hoomin_id uuid not null references auth.users(id) on delete cascade,
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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pets_name_length check (char_length(name) between 1 and 80),
  constraint pets_species_length check (species is null or char_length(species) <= 80),
  constraint pets_time_zone_length check (time_zone is null or char_length(time_zone) <= 80)
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
  storage_bucket text not null default 'app-files',
  storage_path text not null,
  content_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint uploaded_files_owner_type_check check (owner_type in ('pet', 'daily_thought', 'family')),
  constraint uploaded_files_file_kind_check check (
    file_kind in ('pet_reference_photo', 'pet_style_reference', 'thought_image')
  ),
  constraint uploaded_files_storage_path_length check (char_length(storage_path) between 1 and 1024),
  constraint uploaded_files_unique_storage_object unique (storage_bucket, storage_path)
);

create index uploaded_files_family_id_idx on public.uploaded_files (family_id);
create index uploaded_files_owner_idx on public.uploaded_files (owner_type, owner_id);

create table public.daily_thoughts (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  local_date date not null,
  text text not null,
  image_file_id uuid references public.uploaded_files(id) on delete set null,
  generator_version text not null default 'mock-v1',
  created_at timestamptz not null default now(),
  constraint daily_thoughts_text_length check (char_length(text) between 1 and 200),
  constraint daily_thoughts_one_per_pet_per_day unique (pet_id, local_date)
);

create index daily_thoughts_pet_id_local_date_idx on public.daily_thoughts (pet_id, local_date desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('app-files', 'app-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_memberships membership
    where membership.family_id = target_family_id
      and membership.hoomin_id = auth.uid()
  );
$$;

create or replace function public.pet_family_id(target_pet_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id
  from public.pets
  where id = target_pet_id;
$$;

create or replace function public.storage_object_family_id(object_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return nullif(split_part(object_name, '/', 1), '')::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

alter table public.hoomin_profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_memberships enable row level security;
alter table public.family_invites enable row level security;
alter table public.pets enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.daily_thoughts enable row level security;

create policy "hoomins can read their own profile"
on public.hoomin_profiles for select
to authenticated
using (id = auth.uid());

create policy "hoomins can insert their own profile"
on public.hoomin_profiles for insert
to authenticated
with check (id = auth.uid());

create policy "hoomins can update their own profile"
on public.hoomin_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "family members can read families"
on public.families for select
to authenticated
using (public.is_family_member(id));

create policy "authenticated hoomins can create families"
on public.families for insert
to authenticated
with check (created_by = auth.uid());

create policy "family members can update families"
on public.families for update
to authenticated
using (public.is_family_member(id))
with check (public.is_family_member(id));

create policy "family members can read memberships"
on public.family_memberships for select
to authenticated
using (public.is_family_member(family_id));

create policy "hoomins can create their own owner membership"
on public.family_memberships for insert
to authenticated
with check (
  hoomin_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from public.families family
    where family.id = family_id
      and family.created_by = auth.uid()
  )
);

create policy "family members can read invites"
on public.family_invites for select
to authenticated
using (public.is_family_member(family_id));

create policy "family members can create invites"
on public.family_invites for insert
to authenticated
with check (public.is_family_member(family_id) and created_by = auth.uid());

create policy "family members can update invites"
on public.family_invites for update
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy "family members can read pets"
on public.pets for select
to authenticated
using (public.is_family_member(family_id));

create policy "family members can create pets"
on public.pets for insert
to authenticated
with check (public.is_family_member(family_id) and created_by = auth.uid());

create policy "family members can update pets"
on public.pets for update
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy "family members can read uploaded files"
on public.uploaded_files for select
to authenticated
using (public.is_family_member(family_id));

create policy "family members can create uploaded files"
on public.uploaded_files for insert
to authenticated
with check (public.is_family_member(family_id) and uploaded_by = auth.uid());

create policy "family members can read daily thoughts"
on public.daily_thoughts for select
to authenticated
using (public.is_family_member(public.pet_family_id(pet_id)));

create policy "family members can create daily thoughts"
on public.daily_thoughts for insert
to authenticated
with check (public.is_family_member(public.pet_family_id(pet_id)));

create policy "family members can update daily thoughts"
on public.daily_thoughts for update
to authenticated
using (public.is_family_member(public.pet_family_id(pet_id)))
with check (public.is_family_member(public.pet_family_id(pet_id)));

create policy "family members can read app file objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'app-files'
  and public.is_family_member(public.storage_object_family_id(name))
);

create policy "family members can upload app file objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'app-files'
  and public.is_family_member(public.storage_object_family_id(name))
);
