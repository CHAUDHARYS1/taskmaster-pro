-- ─────────────────────────────────────────────────────────
-- Taskmaster Pro · Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ─────────────────────────────────────────────────────────

-- ── Tables ────────────────────────────────────────────────

-- Workspaces (personal or team boards)
create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Membership — who belongs to which workspace and in what role
create table public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  joined_at    timestamptz default now(),
  primary key  (workspace_id, user_id)
);

-- Tasks — belong to a workspace, not directly to a user
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  text         text not null,
  due_date     date,
  status       text not null default 'toDo'
                 check (status in ('toDo', 'inProgress', 'inReview', 'done')),
  position     float not null default 0,
  created_by   uuid references auth.users(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Auto-create personal workspace on signup ───────────────
-- Phase 1: workspace id = user id so the frontend can derive it without an extra query
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.workspaces (id, name, owner_id)
  values (new.id, 'My Workspace', new.id);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ─────────────────────────────────────
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.tasks             enable row level security;

-- Workspaces: visible to members only
create policy "members can see their workspaces"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = workspaces.id
        and user_id = auth.uid()
    )
  );

-- Workspace members: non-recursive check — users can see their own membership rows only
-- (Phase 2 will use a security definer function to show co-members without recursion)
create policy "members can see their own memberships"
  on public.workspace_members for select
  using (user_id = auth.uid());

-- Tasks: select / insert / update / delete scoped to workspace members
create policy "members can view tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = tasks.workspace_id
        and user_id = auth.uid()
    )
  );

create policy "members can add tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_id = tasks.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'member')
    )
  );

create policy "members can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = tasks.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'member')
    )
  );

create policy "members can delete tasks"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = tasks.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'member')
    )
  );

-- ── Enable Realtime ────────────────────────────────────────
-- In the Supabase dashboard also go to:
-- Database → Replication → supabase_realtime publication → add "tasks" table
alter publication supabase_realtime add table public.tasks;
