-- Hoomin timezone settings for local-day daily thought generation.
-- Platform note: update harness/platform-dependencies.md when Supabase schema usage changes.

alter table public.hoomins
  add column if not exists time_zone text;

update public.hoomins
set time_zone = 'America/Los_Angeles'
where time_zone is null;

alter table public.hoomins
  alter column time_zone set default 'America/Los_Angeles',
  alter column time_zone set not null;

alter table public.hoomins
  drop constraint if exists hoomins_time_zone_length;

alter table public.hoomins
  add constraint hoomins_time_zone_length check (
    char_length(time_zone) between 1 and 80
  );
