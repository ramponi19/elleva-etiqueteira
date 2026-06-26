-- ============================================================
-- Elleva — Convites de membros
-- ============================================================

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  role        text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  token       uuid not null default gen_random_uuid() unique,
  invited_by  uuid references public.profiles(id) on delete set null,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now(),
  unique (org_id, email)
);

create index idx_invitations_org_id on public.invitations(org_id);
create index idx_invitations_token on public.invitations(token);
create index idx_invitations_email on public.invitations(email);

alter table public.invitations enable row level security;

-- Org members can view their org's invitations
create policy "Org members can view invitations"
  on public.invitations for select
  using (org_id = public.my_org_id());

-- Admins/owners can manage invitations
create policy "Admins can manage invitations"
  on public.invitations for all
  using (
    org_id = public.my_org_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- ============================================================
-- ACCEPT INVITATION (security definer — bypasses RLS safely)
-- ============================================================
create or replace function public.accept_invitation(invitation_token uuid)
returns jsonb language plpgsql security definer as $$
declare
  inv record;
  uid uuid := auth.uid();
begin
  if uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into inv
  from public.invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now();

  if inv is null then
    return jsonb_build_object('error', 'invalid_or_expired');
  end if;

  -- Link the user's profile to the org
  update public.profiles
  set org_id = inv.org_id,
      role = inv.role
  where id = uid;

  -- Mark invitation accepted
  update public.invitations
  set status = 'accepted'
  where id = inv.id;

  return jsonb_build_object('success', true, 'org_id', inv.org_id);
end;
$$;
