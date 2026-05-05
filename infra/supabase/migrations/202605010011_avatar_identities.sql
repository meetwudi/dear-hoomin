create table if not exists public.avatar_identities (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  subject_type text not null,
  subject_id uuid not null,
  display_name text not null,
  selected_avatar_file_id uuid,
  avatar_generation_status text not null default 'not_started',
  avatar_generation_error text,
  avatar_generation_started_at timestamptz,
  avatar_generation_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avatar_identities_subject_type_check check (
    subject_type in ('pet', 'hoomin', 'companion_object')
  ),
  constraint avatar_identities_display_name_length check (
    char_length(display_name) between 1 and 120
  ),
  constraint avatar_identities_generation_status_check check (
    avatar_generation_status in ('not_started', 'in_progress', 'succeeded', 'failed')
  ),
  constraint avatar_identities_unique_subject unique (family_id, subject_type, subject_id)
);

create index if not exists avatar_identities_family_id_idx
  on public.avatar_identities (family_id);

create trigger set_avatar_identities_updated_at
before update on public.avatar_identities
for each row execute function public.set_updated_at();

alter table public.uploaded_files
  drop constraint if exists uploaded_files_owner_type_check;

alter table public.uploaded_files
  add constraint uploaded_files_owner_type_check check (
    owner_type in ('pet', 'daily_thought', 'family', 'avatar_identity')
  );

alter table public.uploaded_files
  drop constraint if exists uploaded_files_file_kind_check;

alter table public.uploaded_files
  add constraint uploaded_files_file_kind_check check (
    file_kind in (
      'pet_reference_photo',
      'pet_style_reference',
      'pet_avatar_candidate',
      'thought_image',
      'journal_photo',
      'avatar_reference_photo',
      'avatar_candidate'
    )
  );

alter table public.avatar_identities
  add constraint avatar_identities_selected_avatar_file_id_fkey
  foreign key (selected_avatar_file_id) references public.uploaded_files(id) on delete set null;

create table if not exists public.avatar_candidates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  avatar_identity_id uuid not null references public.avatar_identities(id) on delete cascade,
  file_id uuid not null references public.uploaded_files(id) on delete cascade,
  generation_group_id uuid,
  instructions text,
  prompt text,
  created_by uuid references public.hoomins(id) on delete set null,
  selected_at timestamptz,
  created_at timestamptz not null default now(),
  constraint avatar_candidates_instructions_length check (
    instructions is null or char_length(instructions) <= 1000
  ),
  constraint avatar_candidates_identity_file_unique unique (avatar_identity_id, file_id)
);

create index if not exists avatar_candidates_identity_id_idx
  on public.avatar_candidates (avatar_identity_id, created_at desc);

create index if not exists avatar_candidates_generation_group_id_idx
  on public.avatar_candidates (generation_group_id);

insert into public.avatar_identities (
  family_id,
  subject_type,
  subject_id,
  display_name,
  selected_avatar_file_id,
  avatar_generation_status,
  avatar_generation_error,
  avatar_generation_started_at,
  avatar_generation_completed_at,
  created_at,
  updated_at
)
select
  pet.family_id,
  'pet',
  pet.id,
  pet.name,
  pet.selected_avatar_file_id,
  pet.avatar_generation_status,
  pet.avatar_generation_error,
  pet.avatar_generation_started_at,
  pet.avatar_generation_completed_at,
  pet.created_at,
  pet.updated_at
from public.pets pet
on conflict (family_id, subject_type, subject_id) do update
set
  display_name = excluded.display_name,
  selected_avatar_file_id = excluded.selected_avatar_file_id,
  avatar_generation_status = excluded.avatar_generation_status,
  avatar_generation_error = excluded.avatar_generation_error,
  avatar_generation_started_at = excluded.avatar_generation_started_at,
  avatar_generation_completed_at = excluded.avatar_generation_completed_at;

insert into public.avatar_candidates (
  family_id,
  avatar_identity_id,
  file_id,
  generation_group_id,
  instructions,
  prompt,
  created_by,
  selected_at,
  created_at
)
select
  candidate.family_id,
  identity.id,
  candidate.file_id,
  candidate.generation_group_id,
  candidate.instructions,
  candidate.prompt,
  candidate.created_by,
  candidate.selected_at,
  candidate.created_at
from public.pet_avatar_candidates candidate
join public.avatar_identities identity
  on identity.family_id = candidate.family_id
  and identity.subject_type = 'pet'
  and identity.subject_id = candidate.pet_id
where not exists (
  select 1
  from public.avatar_candidates existing
  where existing.avatar_identity_id = identity.id
    and existing.file_id = candidate.file_id
);

update public.uploaded_files file
set
  owner_type = 'avatar_identity',
  owner_id = identity.id,
  file_kind = 'avatar_candidate'
from public.pet_avatar_candidates candidate
join public.avatar_identities identity
  on identity.family_id = candidate.family_id
  and identity.subject_type = 'pet'
  and identity.subject_id = candidate.pet_id
where file.id = candidate.file_id
  and file.owner_type = 'pet'
  and file.file_kind = 'pet_avatar_candidate';

update public.uploaded_files file
set
  owner_type = 'avatar_identity',
  owner_id = identity.id,
  file_kind = 'avatar_reference_photo'
from public.avatar_identities identity
where identity.subject_type = 'pet'
  and file.family_id = identity.family_id
  and file.owner_type = 'pet'
  and file.owner_id = identity.subject_id
  and file.file_kind = 'pet_reference_photo';

alter table public.uploaded_files
  drop constraint if exists uploaded_files_file_kind_check;

alter table public.uploaded_files
  add constraint uploaded_files_file_kind_check check (
    file_kind in (
      'pet_style_reference',
      'thought_image',
      'journal_photo',
      'avatar_reference_photo',
      'avatar_candidate'
    )
  );

drop table if exists public.pet_avatar_candidates;

alter table public.pets
  drop constraint if exists pets_selected_avatar_file_id_fkey,
  drop constraint if exists pets_avatar_generation_status_check,
  drop column if exists selected_avatar_file_id,
  drop column if exists avatar_generation_status,
  drop column if exists avatar_generation_error,
  drop column if exists avatar_generation_started_at,
  drop column if exists avatar_generation_completed_at;
