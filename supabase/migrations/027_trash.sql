-- ── Trashed tasks table ────────────────────────────────────────────────────
create table if not exists public.trashed_tasks (
  id                uuid        primary key,
  workspace_id      uuid        not null references public.workspaces(id) on delete cascade,
  project_id        uuid        references public.projects(id) on delete set null,
  text              text        not null,
  description       text,
  pre_delete_status text        not null default 'toDo',
  priority          text,
  labels            text[]      not null default '{}',
  assignee_id       uuid        references auth.users(id) on delete set null,
  due_date          date,
  due_time          text,
  position          float8      not null default 0,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz not null default now()
);

alter table public.trashed_tasks enable row level security;

do $$ begin
  create policy "workspace members can view trash"
    on public.trashed_tasks for select
    using (
      exists (
        select 1 from public.workspace_members
        where workspace_id = trashed_tasks.workspace_id
          and user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members can delete from trash"
    on public.trashed_tasks for delete
    using (
      exists (
        select 1 from public.workspace_members
        where workspace_id = trashed_tasks.workspace_id
          and user_id = auth.uid()
          and role in ('owner', 'member')
      )
    );
exception when duplicate_object then null; end $$;

-- ── trash_task RPC ──────────────────────────────────────────────────────────
create or replace function public.trash_task(p_task_id uuid)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.tasks t
    join public.workspace_members wm on wm.workspace_id = t.workspace_id
    where t.id = p_task_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'member')
  ) then
    raise exception 'Not authorized to delete this task';
  end if;

  insert into public.trashed_tasks (
    id, workspace_id, project_id, text, description, pre_delete_status,
    priority, labels, assignee_id, due_date, due_time, position, created_at
  )
  select
    id, workspace_id, project_id, text, description, status,
    priority, labels, assignee_id, due_date, due_time, position, created_at
  from public.tasks
  where id = p_task_id;

  delete from public.tasks where id = p_task_id;
end;
$$;

-- ── restore_trashed_task RPC ────────────────────────────────────────────────
create or replace function public.restore_trashed_task(p_task_id uuid)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.trashed_tasks tt
    join public.workspace_members wm on wm.workspace_id = tt.workspace_id
    where tt.id = p_task_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'member')
  ) then
    raise exception 'Not authorized to restore this task';
  end if;

  insert into public.tasks (
    id, workspace_id, project_id, text, description, status,
    priority, labels, assignee_id, due_date, due_time, position, created_at
  )
  select
    id, workspace_id, project_id, text, description, 'toDo',
    priority, labels, assignee_id, due_date, due_time,
    coalesce(
      (select max(position) from public.tasks t
       where t.workspace_id = tt.workspace_id and t.status = 'toDo'),
      0
    ) + 1000,
    created_at
  from public.trashed_tasks tt
  where tt.id = p_task_id;

  delete from public.trashed_tasks where id = p_task_id;
end;
$$;

-- ── Purge trash older than 30 days ─────────────────────────────────────────
create or replace function public.purge_old_trash()
returns void language plpgsql security definer as $$
begin
  delete from public.trashed_tasks
  where deleted_at < now() - interval '30 days';
end;
$$;

-- ── pg_cron schedule ───────────────────────────────────────────────────────
do $$ begin
  perform cron.schedule('purge-old-trash', '0 1 * * *',
    'select public.purge_old_trash()');
exception when duplicate_object then null;
         when undefined_function then null;
         when others then null;
end $$;
