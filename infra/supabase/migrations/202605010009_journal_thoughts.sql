alter table public.hoomins
  add column if not exists thought_generation_instructions text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.hoomins'::regclass
      and conname = 'hoomins_thought_generation_instructions_length'
  ) then
    alter table public.hoomins
      add constraint hoomins_thought_generation_instructions_length check (
        thought_generation_instructions is null or char_length(thought_generation_instructions) <= 1000
      );
  end if;
end $$;

alter table public.daily_thoughts
  add column if not exists source text not null default 'daily',
  add column if not exists journal_text text,
  add column if not exists created_by uuid references public.hoomins(id) on delete set null;

alter table public.daily_thoughts
  drop constraint if exists daily_thoughts_one_per_pet_per_day;

create unique index if not exists daily_thoughts_one_daily_per_pet_per_day_idx
  on public.daily_thoughts (pet_id, local_date)
  where source = 'daily';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.daily_thoughts'::regclass
      and conname = 'daily_thoughts_source_check'
  ) then
    alter table public.daily_thoughts
      add constraint daily_thoughts_source_check check (source in ('daily', 'journal'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.daily_thoughts'::regclass
      and conname = 'daily_thoughts_journal_text_length'
  ) then
    alter table public.daily_thoughts
      add constraint daily_thoughts_journal_text_length check (
        journal_text is null or char_length(journal_text) <= 1000
      );
  end if;
end $$;

alter table public.uploaded_files
  drop constraint if exists uploaded_files_file_kind_check;

alter table public.uploaded_files
  add constraint uploaded_files_file_kind_check check (
    file_kind in (
      'pet_reference_photo',
      'pet_style_reference',
      'pet_avatar_candidate',
      'thought_image',
      'journal_photo'
    )
  );
