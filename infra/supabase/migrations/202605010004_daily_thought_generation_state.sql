alter table public.daily_thoughts
  add column if not exists image_generation_status text not null default 'not_started',
  add column if not exists image_generation_prompt text,
  add column if not exists image_generation_error text,
  add column if not exists image_generation_started_at timestamptz,
  add column if not exists image_generation_completed_at timestamptz;

alter table public.daily_thoughts
  drop constraint if exists daily_thoughts_image_generation_status_check;

alter table public.daily_thoughts
  add constraint daily_thoughts_image_generation_status_check check (
    image_generation_status in ('not_started', 'in_progress', 'succeeded', 'failed')
  );
