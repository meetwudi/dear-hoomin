alter table public.avatar_identities
  add column if not exists reference_name text;

alter table public.avatar_identities
  drop constraint if exists avatar_identities_reference_name_length;

alter table public.avatar_identities
  add constraint avatar_identities_reference_name_length check (
    reference_name is null
    or char_length(reference_name) between 1 and 40
  );

create index if not exists avatar_identities_hoomin_reference_name_idx
  on public.avatar_identities (family_id, lower(reference_name))
  where subject_type = 'hoomin'
    and reference_name is not null;
