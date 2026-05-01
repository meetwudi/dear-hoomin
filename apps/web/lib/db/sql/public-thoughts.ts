export const getPublicThought = `
  select
    thought.id,
    thought.public_share_token,
    thought.local_date::text as local_date,
    thought.text,
    thought.image_generation_status,
    pet.name as pet_name,
    image_file.object_key as image_path,
    coalesce(view_counts.views, 0)::int as view_count
  from public.daily_thoughts thought
  join public.pets pet on pet.id = thought.pet_id
  left join public.uploaded_files image_file on image_file.id = thought.image_file_id
  left join lateral (
    select count(*) as views
    from public.public_thought_views view
    where view.thought_id = thought.id
  ) view_counts on true
  where thought.public_share_token = $1
  limit 1
`;

export const recordPublicThoughtView = `
  insert into public.public_thought_views (
    thought_id,
    referrer,
    user_agent
  )
  values ($1, $2, $3)
`;
