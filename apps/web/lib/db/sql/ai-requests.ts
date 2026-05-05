export const createAiRequest = `
  insert into public.ai_requests (
    family_id,
    pet_id,
    thought_id,
    requested_by,
    request_type,
    provider,
    model,
    prompt,
    input_summary
  )
  values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
  returning id
`;

export const markAiRequestSucceeded = `
  update public.ai_requests
  set
    status = 'succeeded',
    output_summary = $2::jsonb,
    provider_request_id = $3,
    completed_at = now()
  where id = $1
`;

export const markAiRequestFailed = `
  update public.ai_requests
  set
    status = 'failed',
    error = $2,
    completed_at = now()
  where id = $1
`;
