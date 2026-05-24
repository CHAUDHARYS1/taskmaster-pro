-- ─────────────────────────────────────────────────────────────────
-- Phase 2 · Teams, Invitations, Profiles
-- Run this in Supabase SQL Editor AFTER the original schema.sql
-- ─────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────
-- Public-facing user info (email) safe to expose to workspace members
create table public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  email text not null
);

alter table public.profiles enable row level security;

-- Any authenticated user can read profiles (needed to show member emails)
create policy "authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Backfill profiles for existing users
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ── Update signup trigger to also create a profile ────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Personal workspace (id = user.id so frontend can derive it without a query)
  insert into public.workspaces (id, name, owner_id)
  values (new.id, 'My Workspace', new.id);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.id, 'owner');

  -- Public profile
  insert into public.profiles (id, email)
  values (new.id, new.email);

  return new;
end;
$$ language plpgsql security definer;

-- ── Workspace members view (joins profiles for emails) ────────────
create or replace view public.workspace_members_view as
select
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.joined_at,
  p.email
from public.workspace_members wm
join public.profiles p on p.id = wm.user_id;

-- ── Team workspace policies ───────────────────────────────────────
-- Allow authenticated users to create new workspaces
create policy "users can create workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

-- Owners can update their workspace name
create policy "owners can update their workspace"
  on public.workspaces for update
  using (owner_id = auth.uid());

-- ── Auto-add owner as member when a team workspace is created ─────
create or replace function public.handle_new_workspace()
returns trigger as $$
begin
  -- personal workspace (id = owner_id) is already handled by handle_new_user
  if new.id != new.owner_id then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict (workspace_id, user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- ── Security definer helper (fixes RLS recursion for co-members) ──
create or replace function public.get_my_workspace_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select workspace_id from public.workspace_members where user_id = auth.uid();
$$;

-- Update workspace_members policy to show co-members (non-recursive via helper)
drop policy "members can see their own memberships" on public.workspace_members;

create policy "members can see workspace members"
  on public.workspace_members for select
  using (workspace_id in (select public.get_my_workspace_ids()));

-- Update workspaces policy to use helper (avoids any recursion chain)
drop policy "members can see their workspaces" on public.workspaces;

create policy "members can see their workspaces"
  on public.workspaces for select
  using (id in (select public.get_my_workspace_ids()));

-- ── Invitations ───────────────────────────────────────────────────
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email        text not null,
  role         text not null default 'member' check (role in ('member', 'viewer')),
  token        uuid default gen_random_uuid() not null unique,
  invited_by   uuid references auth.users(id),
  accepted_at  timestamptz,
  expires_at   timestamptz default now() + interval '7 days'
);

alter table public.invitations enable row level security;

create policy "members can view workspace invitations"
  on public.invitations for select
  using (workspace_id in (select public.get_my_workspace_ids()));

create policy "members can create invitations"
  on public.invitations for insert
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
        and role in ('owner', 'member')
    )
  );

-- ── Accept invitation RPC ─────────────────────────────────────────
-- Called by the frontend when a user visits /invite/:token
create or replace function public.accept_invitation(invite_token uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_invite public.invitations;
begin
  select * into v_invite
  from public.invitations
  where token = invite_token
    and accepted_at is null
    and expires_at > now();

  if not found then
    raise exception 'Invitation not found or has expired';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.invitations
  set accepted_at = now()
  where token = invite_token;

  return jsonb_build_object('workspace_id', v_invite.workspace_id);
end;
$$;

-- ── Remove member (owners only) ───────────────────────────────────
create or replace function public.remove_member(p_workspace_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Only workspace owner can remove members
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Only workspace owners can remove members';
  end if;

  -- Cannot remove the owner
  if p_user_id = auth.uid() then
    raise exception 'Cannot remove yourself as owner';
  end if;

  delete from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = p_user_id;
end;
$$;
