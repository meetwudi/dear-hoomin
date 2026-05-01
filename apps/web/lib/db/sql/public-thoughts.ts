export const getPublicThought = `
  select
    thought.id,
    thought.public_share_token,
    thought.local_date::text as local_date,
    thought.source,
    thought.text,
    thought.journal_text,
    thought.image_generation_status,
    pet.name as pet_name,
    image_file.object_key as image_path,
    coalesce(journal_photos.items, '[]'::jsonb) as journal_photos,
    coalesce(view_counts.views, 0)::int as view_count
  from public.daily_thoughts thought
  join public.pets pet on pet.id = thought.pet_id
  left join public.uploaded_files image_file on image_file.id = thought.image_file_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', photo.id,
        'imagePath', photo.object_key,
        'contentType', photo.content_type
      )
      order by photo.created_at asc
    ) as items
    from public.uploaded_files photo
    where photo.owner_type = 'daily_thought'
      and photo.owner_id = thought.id
      and photo.file_kind = 'journal_photo'
  ) journal_photos on true
  left join lateral (
    select count(*) as views
    from public.public_thought_views view
    where view.thought_id = thought.id
  ) view_counts on true
  where thought.public_share_token = $1
  limit 1
`;

export const getPublicThoughtCoverImage = `
  select file.object_key, file.content_type
  from public.daily_thoughts thought
  join public.uploaded_files file
    on (
      file.id = thought.image_file_id
      or (
        file.owner_type = 'daily_thought'
        and file.owner_id = thought.id
        and file.file_kind = 'journal_photo'
      )
    )
  where thought.public_share_token = $1
    and (
      ($2::uuid is null and file.id = thought.image_file_id)
      or file.id = $2::uuid
    )
  order by case when file.id = thought.image_file_id then 0 else 1 end
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
