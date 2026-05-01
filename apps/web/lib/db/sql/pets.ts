export const listPetsForFamily = `
  select
    pet.id,
    pet.family_id,
    pet.name,
    pet.species,
    pet.avatar_generation_status,
    pet.avatar_generation_error,
    reference_file.storage_path as reference_photo_path,
    selected_avatar.storage_path as selected_avatar_path,
    coalesce(avatar_candidates.items, '[]'::jsonb) as avatar_candidates,
    thought.id as thought_id,
    thought.public_share_token,
    thought.local_date::text as local_date,
    thought.text as thought_text,
    thought.image_file_id,
    image_file.storage_path as image_path,
    thought.image_generation_status,
    thought.image_generation_error
  from public.pets pet
  left join lateral (
    select file.storage_path
    from public.uploaded_files file
    where file.owner_type = 'pet'
      and file.owner_id = pet.id
      and file.file_kind = 'pet_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = pet.selected_avatar_file_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', candidate.id,
        'petId', candidate.pet_id,
        'fileId', candidate.file_id,
        'imagePath', file.storage_path,
        'selectedAt', candidate.selected_at
      )
      order by candidate.created_at desc
    ) as items
    from public.pet_avatar_candidates candidate
    join public.uploaded_files file on file.id = candidate.file_id
    where candidate.pet_id = pet.id
  ) avatar_candidates on true
  left join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $2::date
  left join public.uploaded_files image_file on image_file.id = thought.image_file_id
  where pet.family_id = $1
  order by pet.created_at asc
`;

export const countPetsForFamily = `
  select count(*)::int as count
  from public.pets
  where family_id = $1
`;

export const createPet = `
  insert into public.pets (family_id, name, species, created_by)
  values ($1, $2, $3, $4)
  returning id
`;

export const createPetReferenceFile = `
  insert into public.uploaded_files (
    family_id,
    owner_type,
    owner_id,
    file_kind,
    storage_bucket,
    storage_path,
    content_type,
    uploaded_by
  )
  values ($1, 'pet', $2, 'pet_reference_photo', $3, $4, $5, $6)
`;

export const getBaseAvatarStyleAsset = `
  select storage_path, content_type
  from public.app_assets
  where asset_key = 'base_pet_avatar_style'
  limit 1
`;

export const upsertBaseAvatarStyleAsset = `
  insert into public.app_assets (
    asset_key,
    storage_bucket,
    storage_path,
    content_type,
    uploaded_by
  )
  values ('base_pet_avatar_style', 'app-files', $1, $2, $3)
  on conflict (asset_key) do update
  set
    storage_path = excluded.storage_path,
    content_type = excluded.content_type,
    uploaded_by = excluded.uploaded_by,
    updated_at = now()
`;

export const getPetForAvatarGeneration = `
  select
    pet.id as pet_id,
    pet.family_id,
    pet.name as pet_name,
    pet.species,
    pet.avatar_generation_status,
    reference_file.storage_path as reference_photo_path
  from public.pets pet
  join public.family_memberships membership
    on membership.family_id = pet.family_id
    and membership.hoomin_id = $2
  left join lateral (
    select file.storage_path
    from public.uploaded_files file
    where file.owner_type = 'pet'
      and file.owner_id = pet.id
      and file.file_kind = 'pet_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  where pet.id = $1
  limit 1
`;

export const markAvatarGenerationInProgress = `
  update public.pets
  set
    avatar_generation_status = 'in_progress',
    avatar_generation_started_at = now(),
    avatar_generation_completed_at = null,
    avatar_generation_error = null
  where id = $1
    and avatar_generation_status <> 'in_progress'
  returning id
`;

export const markAvatarGenerationFailed = `
  update public.pets
  set
    avatar_generation_status = 'failed',
    avatar_generation_error = $2,
    avatar_generation_completed_at = now()
  where id = $1
`;

export const createAvatarCandidateFile = `
  insert into public.uploaded_files (
    family_id,
    owner_type,
    owner_id,
    file_kind,
    storage_bucket,
    storage_path,
    content_type,
    uploaded_by
  )
  values ($1, 'pet', $2, 'pet_avatar_candidate', 'app-files', $3, $4, $5)
  returning id
`;

export const createAvatarCandidate = `
  insert into public.pet_avatar_candidates (
    family_id,
    pet_id,
    file_id,
    generation_group_id,
    instructions,
    prompt,
    created_by
  )
  values ($1, $2, $3, $4, $5, $6, $7)
`;

export const markAvatarGenerationSucceeded = `
  update public.pets
  set
    avatar_generation_status = 'succeeded',
    avatar_generation_error = null,
    avatar_generation_completed_at = now()
  where id = $1
`;

export const choosePetAvatar = `
  with candidate as (
    select file_id
    from public.pet_avatar_candidates
    where id = $2
      and pet_id = $1
    limit 1
  ),
  updated_pet as (
    update public.pets pet
    set selected_avatar_file_id = candidate.file_id
    from candidate
    where pet.id = $1
    returning pet.id
  )
  update public.pet_avatar_candidates
  set selected_at = case when id = $2 then now() else null end
  where pet_id = $1
    and exists (select 1 from updated_pet)
  returning id
`;

export const ensureDailyThought = `
  insert into public.daily_thoughts (pet_id, local_date, text, public_share_token)
  values ($1, $2::date, $3, encode(gen_random_bytes(24), 'hex'))
  on conflict (pet_id, local_date) do update
  set text = excluded.text
  returning id
`;

export const getPetForGeneration = `
  select
    pet.id as pet_id,
    pet.family_id,
    pet.name as pet_name,
    pet.species,
    thought.id as thought_id,
    thought.text as thought_text,
    thought.image_generation_status,
    reference_file.storage_path as reference_photo_path,
    selected_avatar.storage_path as selected_avatar_path
  from public.pets pet
  join public.family_memberships membership
    on membership.family_id = pet.family_id
    and membership.hoomin_id = $2
  left join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $3::date
  left join lateral (
    select file.storage_path
    from public.uploaded_files file
    where file.owner_type = 'pet'
      and file.owner_id = pet.id
      and file.file_kind = 'pet_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = pet.selected_avatar_file_id
  where pet.id = $1
  limit 1
`;

export const getPetForCronGeneration = `
  select
    pet.id as pet_id,
    pet.family_id,
    pet.name as pet_name,
    pet.species,
    thought.id as thought_id,
    thought.text as thought_text,
    thought.image_generation_status,
    reference_file.storage_path as reference_photo_path,
    selected_avatar.storage_path as selected_avatar_path
  from public.pets pet
  left join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $2::date
  left join lateral (
    select file.storage_path
    from public.uploaded_files file
    where file.owner_type = 'pet'
      and file.owner_id = pet.id
      and file.file_kind = 'pet_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = pet.selected_avatar_file_id
  where pet.id = $1
  limit 1
`;

export const createMissingDailyThoughtsForToday = `
  insert into public.daily_thoughts (pet_id, local_date, text, public_share_token)
  select
    pet.id,
    $1::date,
    concat('today ', pet.name, ' has a little thought brewing.'),
    encode(gen_random_bytes(24), 'hex')
  from public.pets pet
  where not exists (
    select 1
    from public.daily_thoughts thought
    where thought.pet_id = pet.id
      and thought.local_date = $1::date
  )
`;

export const listPetsDueForDailyGeneration = `
  select pet.id
  from public.pets pet
  join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $1::date
  where thought.image_file_id is null
    and thought.image_generation_status in ('not_started', 'failed')
    and pet.selected_avatar_file_id is not null
  order by thought.created_at asc
  limit $2
`;

export const markThoughtGenerationInProgress = `
  update public.daily_thoughts
  set
    image_generation_status = 'in_progress',
    image_generation_started_at = now(),
    image_generation_completed_at = null,
    image_generation_error = null
  where id = $1
    and image_generation_status <> 'in_progress'
  returning id
`;

export const markThoughtGenerationFailed = `
  update public.daily_thoughts
  set
    image_generation_status = 'failed',
    image_generation_error = $2,
    image_generation_completed_at = now()
  where id = $1
`;

export const createThoughtImageFile = `
  insert into public.uploaded_files (
    family_id,
    owner_type,
    owner_id,
    file_kind,
    storage_bucket,
    storage_path,
    content_type
  )
  values ($1, 'daily_thought', $2, 'thought_image', 'app-files', $3, $4)
  returning id
`;

export const markThoughtGenerationSucceeded = `
  update public.daily_thoughts
  set
    image_file_id = $2,
    image_generation_status = 'succeeded',
    image_generation_prompt = $3,
    image_generation_error = null,
    image_generation_completed_at = now()
  where id = $1
`;
