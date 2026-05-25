-- ── Archived tasks table ───────────────────────────────────────────────────
create table if not exists public.archived_tasks (
  id           uuid        primary key,
  workspace_id uuid        not null references public.workspaces(id) on delete cascade,
  text         text        not null,
  description  text,
  status       text        not null default 'done',
  priority     text,
  labels       uuid[]      not null default '{}',
  assignee_id  uuid        references auth.users(id) on delete set null,
  due_date     date,
  position     float8      not null default 0,
  created_at   timestamptz not null default now(),
  archived_at  timestamptz not null default now()
);

alter table public.archived_tasks enable row level security;

do $$ begin
  create policy "workspace members can view archives"
    on public.archived_tasks for select
    using (
      exists (
        select 1 from public.workspace_members
        where workspace_id = archived_tasks.workspace_id
          and user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owners can delete archives"
    on public.archived_tasks for delete
    using (
      exists (
        select 1 from public.workspace_members
        where workspace_id = archived_tasks.workspace_id
          and user_id = auth.uid()
          and role = 'owner'
      )
    );
exception when duplicate_object then null; end $$;

-- ── Auto-archive function (runs via pg_cron, security definer) ─────────────
create or replace function public.auto_archive_done_tasks()
returns void language plpgsql security definer as $$
begin
  insert into public.archived_tasks (
    id, workspace_id, text, description, status, priority,
    labels, assignee_id, due_date, position, created_at
  )
  select
    id, workspace_id, text, description, status, priority,
    labels, assignee_id, due_date, position, created_at
  from public.tasks
  where status = 'done';

  delete from public.tasks where status = 'done';
end;
$$;

-- ── Manual archive RPC (owner-only, workspace-scoped) ──────────────────────
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
    id, workspace_id, text, description, status, priority,
    labels, assignee_id, due_date, position, created_at
  )
  select
    id, workspace_id, text, description, status, priority,
    labels, assignee_id, due_date, position, created_at
  from public.tasks
  where status = 'done'
    and workspace_id = p_workspace_id;

  get diagnostics v_count = row_count;
  delete from public.tasks where status = 'done' and workspace_id = p_workspace_id;
  return v_count;
end;
$$;

-- ── Restore RPC (any member can restore to toDo) ───────────────────────────
create or replace function public.restore_archived_task(p_task_id uuid)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.archived_tasks at2
    join public.workspace_members wm on wm.workspace_id = at2.workspace_id
    where at2.id = p_task_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'member')
  ) then
    raise exception 'Not authorized to restore this task';
  end if;

  insert into public.tasks (
    id, workspace_id, text, description, status, priority,
    labels, assignee_id, due_date, position, created_at
  )
  select
    id, workspace_id, text, description, 'toDo', priority,
    labels, assignee_id, due_date,
    coalesce(
      (select max(position) from public.tasks t
       where t.workspace_id = at2.workspace_id and t.status = 'toDo'),
      0
    ) + 1000,
    created_at
  from public.archived_tasks at2
  where id = p_task_id;

  delete from public.archived_tasks where id = p_task_id;
end;
$$;

-- ── Purge archives older than 30 days ─────────────────────────────────────
create or replace function public.purge_old_archives()
returns void language plpgsql security definer as $$
begin
  delete from public.archived_tasks
  where archived_at < now() - interval '30 days';
end;
$$;

-- ── pg_cron schedules (requires pg_cron extension; enable in Supabase dashboard) ──
-- If pg_cron is not installed these blocks are silently skipped.
do $$ begin
  create extension if not exists pg_cron schema cron;
exception when others then null; end $$;

do $$ begin
  perform cron.schedule('archive-done-tasks', '0 21 * * 5',
    'select public.auto_archive_done_tasks()');
exception when duplicate_object then null;
         when undefined_function then null;
         when others then null;
end $$;

do $$ begin
  perform cron.schedule('purge-old-archives', '0 0 * * *',
    'select public.purge_old_archives()');
exception when duplicate_object then null;
         when undefined_function then null;
         when others then null;
end $$;
