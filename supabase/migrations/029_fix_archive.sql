-- Migration 029: Fix archived_tasks schema and all archive functions
--
-- Problems fixed:
--   1. archived_tasks.assignee_id FK referenced auth.users instead of profiles,
--      breaking the PostgREST join `profiles!assignee_id` in useArchive.js
--   2. archive_task RPC missing project_id, due_time, completed_at (schema drift)
--   3. archived_tasks.labels was uuid[] while tasks.labels is text[] (type mismatch)
--   4. archived_tasks missing completed_at column (queried by useMondayStats)

-- ── 1. Fix FK: archived_tasks.assignee_id → profiles ──────────────────────
alter table public.archived_tasks
  drop constraint if exists archived_tasks_assignee_id_fkey;

alter table public.archived_tasks
  add constraint archived_tasks_assignee_id_fkey
  foreign key (assignee_id) references public.profiles(id) on delete set null;

-- ── 2. Change labels uuid[] → text[] (matches tasks.labels) ───────────────
alter table public.archived_tasks
  alter column labels type text[] using labels::text[];

-- ── 3. Add completed_at column ─────────────────────────────────────────────
alter table public.archived_tasks
  add column if not exists completed_at timestamptz;

-- ── 4. archive_task — copy all current task columns ───────────────────────
create or replace function public.archive_task(p_task_id uuid)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.tasks t
    join public.workspace_members wm on wm.workspace_id = t.workspace_id
    where t.id = p_task_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'member')
  ) then
    raise exception 'Not authorized to archive this task';
  end if;

  insert into public.archived_tasks (
    id, workspace_id, project_id, text, description, status, priority,
    labels, assignee_id, due_date, due_time, position, created_at, completed_at
  )
  select
    id, workspace_id, project_id, text, description, status, priority,
    labels, assignee_id, due_date, due_time, position, created_at, completed_at
  from public.tasks
  where id = p_task_id;

  delete from public.tasks where id = p_task_id;
end;
$$;

-- ── 5. restore_archived_task — restore project_id and due_time ────────────
create or replace function public.restore_archived_task(p_task_id uuid)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.archived_tasks a
    join public.workspace_members wm on wm.workspace_id = a.workspace_id
    where a.id = p_task_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'member')
  ) then
    raise exception 'Not authorized to restore this task';
  end if;

  insert into public.tasks (
    id, workspace_id, project_id, text, description, status, priority,
    labels, assignee_id, due_date, due_time, position, created_at
  )
  select
    a.id, a.workspace_id, a.project_id, a.text, a.description, 'toDo', a.priority,
    a.labels, a.assignee_id, a.due_date, a.due_time,
    coalesce(
      (select max(position) from public.tasks t
       where t.workspace_id = a.workspace_id and t.status = 'toDo'),
      0
    ) + 1000,
    a.created_at
  from public.archived_tasks a
  where a.id = p_task_id;

  delete from public.archived_tasks where id = p_task_id;
end;
$$;

-- ── 6. auto_archive_done_tasks — copy all columns ─────────────────────────
create or replace function public.auto_archive_done_tasks()
returns void language plpgsql security definer as $$
begin
  insert into public.archived_tasks (
    id, workspace_id, project_id, text, description, status, priority,
    labels, assignee_id, due_date, due_time, position, created_at, completed_at
  )
  select
    id, workspace_id, project_id, text, description, status, priority,
    labels, assignee_id, due_date, due_time, position, created_at, completed_at
  from public.tasks
  where status = 'done';

  delete from public.tasks where status = 'done';
end;
$$;

-- ── 7. archive_workspace_done — copy all columns ──────────────────────────
create or replace function public.archive_workspace_done(p_workspace_id uuid)
returns integer language plpgsql security definer as $$
declare v_count integer;
begin
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Only workspace owners can archive tasks';
  end if;

  insert into public.archived_tasks (
    id, workspace_id, project_id, text, description, status, priority,
    labels, assignee_id, due_date, due_time, position, created_at, completed_at
  )
  select
    id, workspace_id, project_id, text, description, status, priority,
    labels, assignee_id, due_date, due_time, position, created_at, completed_at
  from public.tasks
  where status = 'done'
    and workspace_id = p_workspace_id;

  get diagnostics v_count = row_count;
  delete from public.tasks where status = 'done' and workspace_id = p_workspace_id;
  return v_count;
end;
$$;
