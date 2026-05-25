-- ── Projects table ────────────────────────────────────────────────────────
create table if not exists public.projects (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        not null references public.workspaces(id) on delete cascade,
  name         text        not null,
  color        text        not null default '#2563EB',
  position     float8      not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.projects enable row level security;

do $$ begin
  create policy "workspace members can view projects"
    on public.projects for select
    using (
      exists (
        select 1 from public.workspace_members
        where workspace_id = projects.workspace_id
          and user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members can create projects"
    on public.projects for insert
    with check (
      exists (
        select 1 from public.workspace_members
        where workspace_id = projects.workspace_id
          and user_id = auth.uid()
          and role in ('owner', 'member')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members can update projects"
    on public.projects for update
    using (
      exists (
        select 1 from public.workspace_members
        where workspace_id = projects.workspace_id
          and user_id = auth.uid()
          and role in ('owner', 'member')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owners can delete projects"
    on public.projects for delete
    using (
      exists (
        select 1 from public.workspace_members
        where workspace_id = projects.workspace_id
          and user_id = auth.uid()
          and role = 'owner'
      )
    );
exception when duplicate_object then null; end $$;

-- ── Add project_id to tasks ────────────────────────────────────────────────
alter table public.tasks
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

-- ── Seed a default "General" project for every existing workspace ──────────
insert into public.projects (workspace_id, name, color, position)
select id, 'General', '#2563EB', 0
from public.workspaces
on conflict do nothing;

-- ── Backfill existing tasks to their workspace's first project ────────────
update public.tasks t
set project_id = (
  select p.id
  from public.projects p
  where p.workspace_id = t.workspace_id
  order by p.position asc, p.created_at asc
  limit 1
)
where t.project_id is null;

-- ── Also add project_id to archived_tasks ─────────────────────────────────
alter table public.archived_tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null;
