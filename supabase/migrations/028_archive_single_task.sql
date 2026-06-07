-- Allow any workspace member to archive a single task immediately,
-- regardless of its current status.
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
    id, workspace_id, text, description, status, priority,
    labels, assignee_id, due_date, position, created_at
  )
  select
    id, workspace_id, text, description, status, priority,
    labels::uuid[], assignee_id, due_date, position, created_at
  from public.tasks
  where id = p_task_id;

  delete from public.tasks where id = p_task_id;
end;
$$;
