export const listPetsForFamily = `
  select
    pet.id,
    pet.family_id,
    pet.name,
    pet.species,
    reference_file.storage_path as reference_photo_path,
    thought.id as thought_id,
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
  left join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $2::date
  left join public.uploaded_files image_file on image_file.id = thought.image_file_id
  where pet.family_id = $1
  order by pet.created_at asc
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

export const ensureDailyThought = `
  insert into public.daily_thoughts (pet_id, local_date, text)
  values ($1, $2::date, $3)
  on conflict (pet_id, local_date) do update
  set text = public.daily_thoughts.text
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
    reference_file.storage_path as reference_photo_path
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
    reference_file.storage_path as reference_photo_path
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
  where pet.id = $1
  limit 1
`;

export const createMissingDailyThoughtsForToday = `
  insert into public.daily_thoughts (pet_id, local_date, text)
  select
    pet.id,
    $1::date,
    concat('today ', pet.name, ' inspected the vibes. suspicious, but acceptable.')
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
    and exists (
      select 1
      from public.uploaded_files file
      where file.owner_type = 'pet'
        and file.owner_id = pet.id
        and file.file_kind = 'pet_reference_photo'
    )
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
