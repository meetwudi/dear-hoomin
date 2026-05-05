create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  thought_id uuid references public.daily_thoughts(id) on delete set null,
  requested_by uuid references public.hoomins(id) on delete set null,
  request_type text not null,
  provider text not null,
  model text not null,
  status text not null default 'in_progress',
  prompt text,
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  provider_request_id text,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_requests_request_type_check check (
    request_type in (
      'pet_avatar',
      'daily_thought_text',
      'daily_thought_image',
      'journal_thought_text',
      'journal_thought_image'
    )
  ),
  constraint ai_requests_provider_check check (provider in ('openai', 'mock')),
  constraint ai_requests_status_check check (
    status in ('in_progress', 'succeeded', 'failed')
  ),
  constraint ai_requests_prompt_length check (
    prompt is null or char_length(prompt) <= 8000
  ),
  constraint ai_requests_provider_request_id_length check (
    provider_request_id is null or char_length(provider_request_id) <= 240
  ),
  constraint ai_requests_error_length check (
    error is null or char_length(error) <= 1000
  )
);

create index if not exists ai_requests_family_created_at_idx
  on public.ai_requests (family_id, created_at desc);

create index if not exists ai_requests_pet_created_at_idx
  on public.ai_requests (pet_id, created_at desc);

create index if not exists ai_requests_thought_created_at_idx
  on public.ai_requests (thought_id, created_at desc);

create index if not exists ai_requests_status_created_at_idx
  on public.ai_requests (status, created_at desc);

create trigger set_ai_requests_updated_at
before update on public.ai_requests
for each row execute function public.set_updated_at();
