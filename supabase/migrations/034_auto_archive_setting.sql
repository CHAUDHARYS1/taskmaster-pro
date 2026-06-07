-- Migration 034: Per-workspace auto-archive setting
--
-- Adds auto_archive_after_days to workspaces (null = off).
-- Replaces the indiscriminate auto_archive_done_tasks() with a
-- workspace-aware version that only touches opted-in workspaces
-- and only moves tasks that have been in 'done' for the configured
-- number of days.

-- ── 1. New column ──────────────────────────────────────────────────────────

alter table public.workspaces
  add column if not exists auto_archive_after_days integer
  check (auto_archive_after_days in (7, 14, 30));

-- ── 2. Replace auto_archive_done_tasks() ──────────────────────────────────
--
-- Previous version (migration 029) archived ALL done tasks from ALL
-- workspaces every Friday — too aggressive. This version:
--   • Only touches workspaces where auto_archive_after_days IS NOT NULL
--   • Only archives tasks where completed_at is known and old enough
--   • Uses ON CONFLICT DO NOTHING to be safe if run more than once

drop function if exists public.auto_archive_done_tasks();

create or replace function public.auto_archive_done_tasks()
returns integer language plpgsql security definer as $$
declare
  v_workspace record;
  v_count     integer;
  v_total     integer := 0;
begin
  for v_workspace in
    select id, auto_archive_after_days
    from public.workspaces
    where auto_archive_after_days is not null
  loop
    insert into public.archived_tasks (
      id, workspace_id, project_id, text, description, status, priority,
      labels, assignee_id, due_date, due_time, position, created_at, completed_at
    )
    select
      id, workspace_id, project_id, text, description, status, priority,
      labels, assignee_id, due_date, due_time, position, created_at, completed_at
    from public.tasks
    where workspace_id = v_workspace.id
      and status       = 'done'
      and completed_at is not null
      and completed_at < now() - (v_workspace.auto_archive_after_days || ' days')::interval
    on conflict (id) do nothing;

    get diagnostics v_count = row_count;
    v_total := v_total + v_count;

    delete from public.tasks
    where workspace_id = v_workspace.id
      and status       = 'done'
      and completed_at is not null
      and completed_at < now() - (v_workspace.auto_archive_after_days || ' days')::interval;
  end loop;

  return v_total;
end;
$$;

-- ── 3. Reschedule cron ─────────────────────────────────────────────────────
--
-- The old 'archive-done-tasks' job ran every Friday and archived everything.
-- Replace it with a daily run that uses the new workspace-aware function.

do $$ begin
  perform cron.unschedule('archive-done-tasks');
exception when others then null; end $$;

do $$ begin
  perform cron.schedule(
    'auto-archive-done',
    '0 3 * * *',
    'select public.auto_archive_done_tasks()'
  );
exception when duplicate_object then null;
         when undefined_function then null;
         when others             then null;
end $$;
