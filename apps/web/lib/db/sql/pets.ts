export const listPetsForFamily = `
  select
    pet.id,
    pet.family_id,
    pet.name,
    pet.species,
    coalesce(avatar_identity.avatar_generation_status, 'not_started') as avatar_generation_status,
    avatar_identity.avatar_generation_error,
    reference_file.object_key as reference_photo_path,
    selected_avatar.object_key as selected_avatar_path,
    coalesce(avatar_candidates.items, '[]'::jsonb) as avatar_candidates,
    thought.id as thought_id,
    thought.public_share_token,
    thought.local_date::text as local_date,
    thought.source as thought_source,
    thought.text as thought_text,
    thought.journal_text,
    thought.image_file_id,
    image_file.object_key as image_path,
    thought.image_generation_status,
    thought.image_generation_error,
    coalesce(today_thoughts.items, '[]'::jsonb) as today_thoughts
  from public.pets pet
  left join public.avatar_identities avatar_identity
    on avatar_identity.family_id = pet.family_id
    and avatar_identity.subject_type = 'pet'
    and avatar_identity.subject_id = pet.id
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = avatar_identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = avatar_identity.selected_avatar_file_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', candidate.id,
        'petId', pet.id,
        'fileId', candidate.file_id,
        'imagePath', file.object_key,
        'selectedAt', candidate.selected_at
      )
      order by candidate.created_at desc
    ) as items
    from public.avatar_candidates candidate
    join public.uploaded_files file on file.id = candidate.file_id
    where candidate.avatar_identity_id = avatar_identity.id
  ) avatar_candidates on true
  left join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $2::date
    and thought.source = 'daily'
  left join public.uploaded_files image_file on image_file.id = thought.image_file_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', today.id,
        'publicShareToken', today.public_share_token,
        'petId', today.pet_id,
        'localDate', today.local_date::text,
        'source', today.source,
        'text', today.text,
        'journalText', today.journal_text,
        'imageFileId', today.image_file_id,
        'imagePath', today_image.object_key,
        'imageGenerationStatus', today.image_generation_status,
        'imageGenerationError', today.image_generation_error,
        'journalPhotos', coalesce(journal_photos.items, '[]'::jsonb)
      )
      order by
        case when today.source = 'daily' then 0 else 1 end,
        today.created_at desc
    ) as items
    from public.daily_thoughts today
    left join public.uploaded_files today_image on today_image.id = today.image_file_id
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
        and photo.owner_id = today.id
        and photo.file_kind = 'journal_photo'
    ) journal_photos on true
    where today.pet_id = pet.id
      and today.local_date = $2::date
  ) today_thoughts on true
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

export const upsertPetAvatarIdentity = `
  insert into public.avatar_identities (
    family_id,
    subject_type,
    subject_id,
    display_name
  )
  values ($1, 'pet', $2, $3)
  on conflict (family_id, subject_type, subject_id) do update
  set display_name = excluded.display_name
  returning id
`;

export const createPetAvatarIdentityReferenceFile = `
  insert into public.uploaded_files (
    family_id,
    owner_type,
    owner_id,
    file_kind,
    object_key,
    content_type,
    uploaded_by
  )
  values ($1, 'avatar_identity', $2, 'avatar_reference_photo', $3, $4, $5)
`;

export const updatePetProfile = `
  update public.pets pet
  set name = $3
  from public.family_memberships membership
  where pet.id = $2
    and pet.family_id = $1
    and membership.family_id = pet.family_id
    and membership.hoomin_id = $4
  returning pet.id
`;

export const getPetDisplayNameForFamily = `
  select name
  from public.pets
  where family_id = $1
    and id = $2
  limit 1
`;

export const getBaseAvatarStyleAsset = `
  select object_key, content_type
  from public.app_assets
  where asset_key = 'base_pet_avatar_style'
  limit 1
`;

export const upsertBaseAvatarStyleAsset = `
  insert into public.app_assets (
    asset_key,
    object_key,
    content_type,
    uploaded_by
  )
  values ('base_pet_avatar_style', $1, $2, $3)
  on conflict (asset_key) do update
  set
    object_key = excluded.object_key,
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
    avatar_identity.avatar_generation_status,
    reference_file.object_key as reference_photo_path
  from public.pets pet
  join public.family_memberships membership
    on membership.family_id = pet.family_id
    and membership.hoomin_id = $2
  join public.avatar_identities avatar_identity
    on avatar_identity.family_id = pet.family_id
    and avatar_identity.subject_type = 'pet'
    and avatar_identity.subject_id = pet.id
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = avatar_identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  where pet.id = $1
  limit 1
`;

export const markAvatarGenerationInProgress = `
  update public.avatar_identities
  set
    avatar_generation_status = 'in_progress',
    avatar_generation_started_at = now(),
    avatar_generation_completed_at = null,
    avatar_generation_error = null
  where subject_type = 'pet'
    and subject_id = $1
    and avatar_generation_status <> 'in_progress'
  returning id
`;

export const markAvatarGenerationFailed = `
  update public.avatar_identities
  set
    avatar_generation_status = 'failed',
    avatar_generation_error = $2,
    avatar_generation_completed_at = now()
  where subject_type = 'pet'
    and subject_id = $1
`;

export const createAvatarCandidateFile = `
  with identity as (
    select id
    from public.avatar_identities
    where family_id = $1
      and subject_type = 'pet'
      and subject_id = $2
    limit 1
  )
  insert into public.uploaded_files (
    family_id,
    owner_type,
    owner_id,
    file_kind,
    object_key,
    content_type,
    uploaded_by
  )
  select $1, 'avatar_identity', identity.id, 'avatar_candidate', $3, $4, $5
  from identity
  returning id, owner_id as avatar_identity_id
`;

export const createAvatarCandidate = `
  insert into public.avatar_candidates (
    family_id,
    avatar_identity_id,
    file_id,
    generation_group_id,
    instructions,
    prompt,
    created_by
  )
  values ($1, $2, $3, $4, $5, $6, $7)
`;

export const markAvatarGenerationSucceeded = `
  update public.avatar_identities
  set
    avatar_generation_status = 'succeeded',
    avatar_generation_error = null,
    avatar_generation_completed_at = now()
  where subject_type = 'pet'
    and subject_id = $1
`;

export const choosePetAvatar = `
  with identity as (
    select id
    from public.avatar_identities
    where subject_type = 'pet'
      and subject_id = $1
    limit 1
  ),
  candidate as (
    select file_id, id
    from public.avatar_candidates
    where id = $2
      and avatar_identity_id = (select id from identity)
    limit 1
  ),
  updated_identity as (
    update public.avatar_identities avatar_identity
    set selected_avatar_file_id = candidate.file_id
    from candidate
    where avatar_identity.id = (select id from identity)
    returning avatar_identity.id
  )
  update public.avatar_candidates
  set selected_at = case when id = (select id from candidate) then now() else null end
  where avatar_identity_id = (select id from identity)
    and exists (select 1 from updated_identity)
  returning id
`;

export const ensureDailyThought = `
  insert into public.daily_thoughts (pet_id, local_date, source, text, public_share_token)
  values ($1, $2::date, 'daily', $3, encode(extensions.gen_random_bytes(24), 'hex'))
  on conflict (pet_id, local_date) where source = 'daily' do update
  set text = excluded.text
  returning id
`;

export const getPetForGeneration = `
  select
    pet.id as pet_id,
    pet.family_id,
    pet.name as pet_name,
    pet.species,
    $3::date::text as local_date,
    thought.id as thought_id,
    thought.text as thought_text,
    thought.image_generation_status,
    reference_file.object_key as reference_photo_path,
    selected_avatar.object_key as selected_avatar_path,
    coalesce(hoomin_selected_avatar.object_key, hoomin_reference_file.object_key) as hoomin_avatar_path,
    hoomin.thought_generation_instructions as extra_instructions
  from public.pets pet
  join public.family_memberships membership
    on membership.family_id = pet.family_id
    and membership.hoomin_id = $2
  join public.hoomins hoomin on hoomin.id = $2
  left join public.avatar_identities avatar_identity
    on avatar_identity.family_id = pet.family_id
    and avatar_identity.subject_type = 'pet'
    and avatar_identity.subject_id = pet.id
  left join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $3::date
    and thought.source = 'daily'
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = avatar_identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = avatar_identity.selected_avatar_file_id
  left join public.avatar_identities hoomin_avatar_identity
    on hoomin_avatar_identity.family_id = pet.family_id
    and hoomin_avatar_identity.subject_type = 'hoomin'
    and hoomin_avatar_identity.subject_id = $2
  left join public.uploaded_files hoomin_selected_avatar
    on hoomin_selected_avatar.id = hoomin_avatar_identity.selected_avatar_file_id
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = hoomin_avatar_identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) hoomin_reference_file on true
  where pet.id = $1
  limit 1
`;

export const getPetForCronGeneration = `
  select
    pet.id as pet_id,
    pet.family_id,
    pet.name as pet_name,
    pet.species,
    $2::date::text as local_date,
    thought.id as thought_id,
    thought.text as thought_text,
    thought.image_generation_status,
    reference_file.object_key as reference_photo_path,
    selected_avatar.object_key as selected_avatar_path,
    hoomin.thought_generation_instructions as extra_instructions
  from public.pets pet
  left join public.hoomins hoomin on hoomin.id = pet.created_by
  left join public.avatar_identities avatar_identity
    on avatar_identity.family_id = pet.family_id
    and avatar_identity.subject_type = 'pet'
    and avatar_identity.subject_id = pet.id
  left join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = $2::date
    and thought.source = 'daily'
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = avatar_identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = avatar_identity.selected_avatar_file_id
  where pet.id = $1
  limit 1
`;

export const getThoughtForImageGeneration = `
  select
    thought.id as thought_id,
    thought.pet_id,
    thought.local_date::text as local_date,
    thought.source,
    thought.text as thought_text,
    thought.journal_text,
    thought.image_file_id,
    thought.image_generation_status,
    pet.family_id,
    pet.name as pet_name,
    pet.species,
    selected_avatar.object_key as selected_avatar_path,
    coalesce(hoomin_selected_avatar.object_key, hoomin_reference_file.object_key) as hoomin_avatar_path,
    journal_photo.object_key as journal_photo_path,
    journal_photo.content_type as journal_photo_content_type
  from public.daily_thoughts thought
  join public.pets pet on pet.id = thought.pet_id
  left join public.avatar_identities avatar_identity
    on avatar_identity.family_id = pet.family_id
    and avatar_identity.subject_type = 'pet'
    and avatar_identity.subject_id = pet.id
  join public.family_memberships membership
    on membership.family_id = pet.family_id
    and membership.hoomin_id = $2
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = avatar_identity.selected_avatar_file_id
  left join public.avatar_identities hoomin_avatar_identity
    on hoomin_avatar_identity.family_id = pet.family_id
    and hoomin_avatar_identity.subject_type = 'hoomin'
    and hoomin_avatar_identity.subject_id = $2
  left join public.uploaded_files hoomin_selected_avatar
    on hoomin_selected_avatar.id = hoomin_avatar_identity.selected_avatar_file_id
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = hoomin_avatar_identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) hoomin_reference_file on true
  left join lateral (
    select file.object_key, file.content_type
    from public.uploaded_files file
    where file.owner_type = 'daily_thought'
      and file.owner_id = thought.id
      and file.file_kind = 'journal_photo'
    order by file.created_at asc
    limit 1
  ) journal_photo on true
  where thought.id = $1
  limit 1
`;

export const listDailyGenerationCandidates = `
  select
    pet.id as pet_id,
    hoomin.id as hoomin_id,
    hoomin.time_zone
  from public.pets pet
  join public.family_memberships membership
    on membership.family_id = pet.family_id
  join public.hoomins hoomin
    on hoomin.id = membership.hoomin_id
  join public.avatar_identities avatar_identity
    on avatar_identity.family_id = pet.family_id
    and avatar_identity.subject_type = 'pet'
    and avatar_identity.subject_id = pet.id
  where avatar_identity.selected_avatar_file_id is not null
  order by pet.created_at asc
`;

export const createMissingDailyThoughtsForPetDates = `
  insert into public.daily_thoughts (pet_id, local_date, source, text, public_share_token)
  select
    due.pet_id,
    due.local_date,
    'daily',
    concat('today ', pet.name, ' has a little thought brewing.'),
    encode(extensions.gen_random_bytes(24), 'hex')
  from unnest($1::uuid[], $2::date[]) as due(pet_id, local_date)
  join public.pets pet on pet.id = due.pet_id
  on conflict (pet_id, local_date) where source = 'daily' do nothing
`;

export const listPetsDueForDailyGenerationForDates = `
  select
    pet.id,
    due.local_date::text as local_date
  from unnest($1::uuid[], $2::date[]) as due(pet_id, local_date)
  join public.pets pet
    on pet.id = due.pet_id
  join public.daily_thoughts thought
    on thought.pet_id = pet.id
    and thought.local_date = due.local_date
    and thought.source = 'daily'
  join public.avatar_identities avatar_identity
    on avatar_identity.family_id = pet.family_id
    and avatar_identity.subject_type = 'pet'
    and avatar_identity.subject_id = pet.id
  where thought.image_file_id is null
    and thought.image_generation_status in ('not_started', 'failed')
    and avatar_identity.selected_avatar_file_id is not null
  order by thought.created_at asc
  limit $3
`;

export const listRecentThoughtTextsForPet = `
  select text
  from public.daily_thoughts
  where pet_id = $1
    and local_date >= $2::date - interval '30 days'
    and local_date < $2::date
  order by local_date desc, created_at desc
  limit 60
`;

export const createJournalThought = `
  insert into public.daily_thoughts (
    pet_id,
    local_date,
    source,
    text,
    journal_text,
    created_by,
    public_share_token,
    generator_version
  )
  values (
    $1,
    $2::date,
    'journal',
    $3,
    $4,
    $5,
    encode(extensions.gen_random_bytes(24), 'hex'),
    'journal-v1'
  )
  returning id
`;

export const createJournalPhotoFile = `
  insert into public.uploaded_files (
    family_id,
    owner_type,
    owner_id,
    file_kind,
    object_key,
    content_type,
    uploaded_by
  )
  values ($1, 'daily_thought', $2, 'journal_photo', $3, $4, $5)
  returning id
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
    object_key,
    content_type
  )
  values ($1, 'daily_thought', $2, 'thought_image', $3, $4)
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
