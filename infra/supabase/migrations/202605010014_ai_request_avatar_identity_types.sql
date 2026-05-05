alter table public.ai_requests
  drop constraint if exists ai_requests_request_type_check;

alter table public.ai_requests
  add constraint ai_requests_request_type_check check (
    request_type in (
      'pet_avatar',
      'hoomin_avatar',
      'avatar_identity',
      'daily_thought_text',
      'daily_thought_image',
      'journal_thought_text',
      'journal_thought_image'
    )
  );
