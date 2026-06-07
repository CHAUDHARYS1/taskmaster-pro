-- Migration 030: Make archive_workspace_done project-aware
-- Adds optional p_project_id parameter so the board button only archives
-- done tasks in the currently selected project (not the whole workspace).

create or replace function public.archive_workspace_done(
  p_workspace_id uuid,
  p_project_id   uuid default null
)
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
    and workspace_id = p_workspace_id
    and (p_project_id is null or project_id = p_project_id);

  get diagnostics v_count = row_count;

  delete from public.tasks
  where status = 'done'
    and workspace_id = p_workspace_id
    and (p_project_id is null or project_id = p_project_id);

  return v_count;
end;
$$;
