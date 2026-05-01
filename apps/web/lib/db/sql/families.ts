export const requireFamilyMembership = `
  select 1
  from public.family_memberships
  where family_id = $1
    and hoomin_id = $2
  limit 1
`;

export const requireFamilyOwner = `
  select 1
  from public.family_memberships
  where family_id = $1
    and hoomin_id = $2
    and role = 'owner'
  limit 1
`;

export const listFamiliesForHoomin = `
  select
    family.id,
    family.name,
    membership.role,
    count(all_members.hoomin_id) as member_count
  from public.family_memberships membership
  join public.families family on family.id = membership.family_id
  left join public.family_memberships all_members on all_members.family_id = family.id
  where membership.hoomin_id = $1
  group by family.id, family.name, membership.role
  order by family.created_at asc
`;

export const getFamilyForHoomin = `
  select
    family.id,
    family.name,
    membership.role,
    count(all_members.hoomin_id) as member_count
  from public.families family
  join public.family_memberships membership
    on membership.family_id = family.id
    and membership.hoomin_id = $2
  left join public.family_memberships all_members on all_members.family_id = family.id
  where family.id = $1
  group by family.id, family.name, membership.role
  limit 1
`;

export const listFamilyMembers = `
  select
    membership.hoomin_id,
    hoomin.email,
    hoomin.display_name,
    hoomin.avatar_url,
    membership.role,
    membership.created_at
  from public.family_memberships membership
  join public.hoomins hoomin on hoomin.id = membership.hoomin_id
  where membership.family_id = $1
  order by membership.created_at asc
`;

export const createFamily = `
  insert into public.families (name, created_by)
  values ($1, $2)
  returning id
`;

export const createOwnerMembership = `
  insert into public.family_memberships (family_id, hoomin_id, role)
  values ($1, $2, 'owner')
`;

export const createFamilyInvite = `
  insert into public.family_invites (
    family_id,
    invite_token,
    created_by,
    expires_at
  )
  values ($1, $2, $3, now() + interval '14 days')
  returning
    id,
    family_id,
    (select name from public.families where id = $1) as family_name,
    invite_token,
    created_at,
    expires_at,
    accepted_at
`;

export const listFamilyInvites = `
  select
    invite.id,
    invite.family_id,
    family.name as family_name,
    invite.invite_token,
    invite.created_at,
    invite.expires_at,
    invite.accepted_at
  from public.family_invites invite
  join public.families family on family.id = invite.family_id
  where invite.family_id = $1
  order by invite.created_at desc
  limit 5
`;

export const getInviteForHoomin = `
  select
    invite.id,
    invite.family_id,
    family.name as family_name,
    invite.invite_token,
    invite.created_at,
    invite.expires_at,
    invite.accepted_at,
    exists (
      select 1
      from public.family_memberships membership
      where membership.family_id = invite.family_id
        and membership.hoomin_id = $2
    ) as is_member,
    (
      select count(*)::text
      from public.family_memberships membership
      where membership.family_id = invite.family_id
    ) as member_count
  from public.family_invites invite
  join public.families family on family.id = invite.family_id
  where invite.invite_token = $1
  limit 1
`;

export const lockInviteForAcceptance = `
  select id, family_id, expires_at
  from public.family_invites
  where invite_token = $1
  for update
`;

export const createMemberMembership = `
  insert into public.family_memberships (family_id, hoomin_id, role)
  values ($1, $2, 'member')
  on conflict (family_id, hoomin_id) do nothing
`;

export const markInviteAccepted = `
  update public.family_invites
  set
    accepted_at = coalesce(accepted_at, now()),
    accepted_by = coalesce(accepted_by, $2)
  where id = $1
`;

export const removeNonOwnerMember = `
  delete from public.family_memberships
  where family_id = $1
    and hoomin_id = $2
    and role <> 'owner'
`;
