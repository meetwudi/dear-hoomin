-- Move family-facing identity references from Supabase Auth to app-owned hoomins.
-- Use NOT VALID constraints so existing shared-database rows are not rewritten or rejected.

alter table public.families
  drop constraint if exists families_created_by_fkey;

alter table public.families
  add constraint families_created_by_hoomins_fkey
  foreign key (created_by) references public.hoomins(id) on delete set null
  not valid;

alter table public.family_memberships
  drop constraint if exists family_memberships_hoomin_id_fkey;

alter table public.family_memberships
  add constraint family_memberships_hoomin_id_hoomins_fkey
  foreign key (hoomin_id) references public.hoomins(id) on delete cascade
  not valid;

alter table public.family_invites
  drop constraint if exists family_invites_created_by_fkey,
  drop constraint if exists family_invites_accepted_by_fkey;

alter table public.family_invites
  add constraint family_invites_created_by_hoomins_fkey
  foreign key (created_by) references public.hoomins(id) on delete set null
  not valid,
  add constraint family_invites_accepted_by_hoomins_fkey
  foreign key (accepted_by) references public.hoomins(id) on delete set null
  not valid;

alter table public.pets
  drop constraint if exists pets_created_by_fkey;

alter table public.pets
  add constraint pets_created_by_hoomins_fkey
  foreign key (created_by) references public.hoomins(id) on delete set null
  not valid;

alter table public.uploaded_files
  drop constraint if exists uploaded_files_uploaded_by_fkey;

alter table public.uploaded_files
  add constraint uploaded_files_uploaded_by_hoomins_fkey
  foreign key (uploaded_by) references public.hoomins(id) on delete set null
  not valid;
