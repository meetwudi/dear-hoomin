alter table public.uploaded_files
  add column if not exists object_key text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'uploaded_files'
      and column_name = 'storage_path'
  ) then
    update public.uploaded_files
    set object_key = storage_path
    where object_key is null;
  end if;
end $$;

alter table public.uploaded_files
  drop constraint if exists uploaded_files_storage_path_length,
  drop constraint if exists uploaded_files_unique_storage_object;

alter table public.uploaded_files
  alter column object_key set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.uploaded_files'::regclass
      and conname = 'uploaded_files_object_key_length'
  ) then
    alter table public.uploaded_files
      add constraint uploaded_files_object_key_length check (char_length(object_key) between 1 and 1024);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.uploaded_files'::regclass
      and conname = 'uploaded_files_unique_object_key'
  ) then
    alter table public.uploaded_files
      add constraint uploaded_files_unique_object_key unique (object_key);
  end if;
end $$;

alter table public.uploaded_files
  drop column if exists storage_bucket,
  drop column if exists storage_path;

alter table public.app_assets
  add column if not exists object_key text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_assets'
      and column_name = 'storage_path'
  ) then
    update public.app_assets
    set object_key = storage_path
    where object_key is null;
  end if;
end $$;

alter table public.app_assets
  drop constraint if exists app_assets_storage_path_length,
  drop constraint if exists app_assets_unique_storage_object;

alter table public.app_assets
  alter column object_key set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_assets'::regclass
      and conname = 'app_assets_object_key_length'
  ) then
    alter table public.app_assets
      add constraint app_assets_object_key_length check (char_length(object_key) between 1 and 1024);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_assets'::regclass
      and conname = 'app_assets_unique_object_key'
  ) then
    alter table public.app_assets
      add constraint app_assets_unique_object_key unique (object_key);
  end if;
end $$;

alter table public.app_assets
  drop column if exists storage_bucket,
  drop column if exists storage_path;
