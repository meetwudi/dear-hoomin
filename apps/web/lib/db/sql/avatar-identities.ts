export const requireFamilyMembership = `
  select 1
  from public.family_memberships
  where family_id = $1
    and hoomin_id = $2
  limit 1
`;

export const upsertAvatarIdentity = `
  insert into public.avatar_identities (
    family_id,
    subject_type,
    subject_id,
    display_name
  )
  values ($1, $2, $3, $4)
  on conflict (family_id, subject_type, subject_id) do update
  set display_name = excluded.display_name
  returning id
`;

export const getAvatarIdentityForSubject = `
  select
    identity.id,
    identity.family_id,
    identity.subject_type,
    identity.subject_id,
    identity.display_name,
    identity.avatar_generation_status,
    identity.avatar_generation_error,
    reference_file.object_key as reference_photo_path,
    selected_avatar.object_key as selected_avatar_path,
    coalesce(candidates.items, '[]'::jsonb) as avatar_candidates
  from public.avatar_identities identity
  join public.family_memberships membership
    on membership.family_id = identity.family_id
    and membership.hoomin_id = $4
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = identity.selected_avatar_file_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', candidate.id,
        'fileId', candidate.file_id,
        'imagePath', file.object_key,
        'selectedAt', candidate.selected_at
      )
      order by candidate.created_at desc
    ) as items
    from public.avatar_candidates candidate
    join public.uploaded_files file on file.id = candidate.file_id
    where candidate.avatar_identity_id = identity.id
  ) candidates on true
  where identity.family_id = $1
    and identity.subject_type = $2
    and identity.subject_id = $3
  limit 1
`;

export const listAvatarIdentitiesForSubjects = `
  select
    identity.id,
    identity.family_id,
    identity.subject_type,
    identity.subject_id,
    identity.display_name,
    identity.avatar_generation_status,
    identity.avatar_generation_error,
    reference_file.object_key as reference_photo_path,
    selected_avatar.object_key as selected_avatar_path,
    coalesce(candidates.items, '[]'::jsonb) as avatar_candidates
  from public.avatar_identities identity
  join public.family_memberships membership
    on membership.family_id = identity.family_id
    and membership.hoomin_id = $4
  left join lateral (
    select file.object_key
    from public.uploaded_files file
    where file.owner_type = 'avatar_identity'
      and file.owner_id = identity.id
      and file.file_kind = 'avatar_reference_photo'
    order by file.created_at desc
    limit 1
  ) reference_file on true
  left join public.uploaded_files selected_avatar
    on selected_avatar.id = identity.selected_avatar_file_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', candidate.id,
        'fileId', candidate.file_id,
        'imagePath', file.object_key,
        'selectedAt', candidate.selected_at
      )
      order by candidate.created_at desc
    ) as items
    from public.avatar_candidates candidate
    join public.uploaded_files file on file.id = candidate.file_id
    where candidate.avatar_identity_id = identity.id
  ) candidates on true
  where identity.family_id = $1
    and identity.subject_type = $2
    and identity.subject_id = any($3::uuid[])
  order by identity.created_at asc
`;

export const requireHoominSubjectInFamily = `
  select 1
  from public.family_memberships
  where family_id = $1
    and hoomin_id = $2
  limit 1
`;

export const createAvatarReferenceFile = `
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
  returning id
`;

export const createAvatarCandidateFile = `
  insert into public.uploaded_files (
    family_id,
    owner_type,
    owner_id,
    file_kind,
    object_key,
    content_type,
    uploaded_by
  )
  values ($1, 'avatar_identity', $2, 'avatar_candidate', $3, $4, $5)
  returning id
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

export const chooseAvatarCandidate = `
  with candidate as (
    select file_id, avatar_identity_id
    from public.avatar_candidates
    where id = $2
      and avatar_identity_id = $1
    limit 1
  ),
  updated_identity as (
    update public.avatar_identities identity
    set selected_avatar_file_id = candidate.file_id
    from candidate
    where identity.id = $1
    returning identity.id
  )
  update public.avatar_candidates
  set selected_at = case when id = $2 then now() else null end
  where avatar_identity_id = $1
    and exists (select 1 from updated_identity)
  returning id
`;
