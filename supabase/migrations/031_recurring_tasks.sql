-- Migration 031: Recurring tasks
--
-- Adds recurrence config to tasks. When a recurring task is completed,
-- a trigger automatically creates the next occurrence in To Do with
-- the due date advanced by the recurrence interval.
--
-- recurrence jsonb shape:
--   { "frequency": "daily"|"weekly"|"monthly"|"yearly", "interval": 1, "end_date": "YYYY-MM-DD" }
--   end_date is optional.

-- ── 1. Add columns to tasks ────────────────────────────────────────────────
alter table public.tasks
  add column if not exists recurrence          jsonb,
  add column if not exists recurrence_parent_id uuid references public.tasks(id) on delete set null;

-- ── 2. Trigger function ────────────────────────────────────────────────────
create or replace function public.handle_task_recurrence()
returns trigger language plpgsql security definer as $$
declare
  v_frequency  text;
  v_interval   int;
  v_end_date   date;
  v_next_due   date;
  v_min_pos    float8;
  v_parent_id  uuid;
begin
  -- Only fire when task just became done AND has recurrence AND has a due date
  if new.status = 'done'
     and (old.status is distinct from 'done')
     and new.recurrence is not null
     and new.due_date is not null
  then
    v_frequency := new.recurrence->>'frequency';
    v_interval  := coalesce((new.recurrence->>'interval')::int, 1);
    v_end_date  := nullif(new.recurrence->>'end_date', '')::date;

    -- Compute next due date
    v_next_due := case v_frequency
      when 'daily'   then new.due_date + (v_interval || ' days')::interval
      when 'weekly'  then new.due_date + (v_interval * 7 || ' days')::interval
      when 'monthly' then new.due_date + (v_interval || ' months')::interval
      when 'yearly'  then new.due_date + (v_interval || ' years')::interval
      else null
    end;

    -- Skip if frequency unknown or next due is past the end date
    if v_next_due is null then return new; end if;
    if v_end_date is not null and v_next_due > v_end_date then return new; end if;

    -- Insert at the top of the To Do column
    select coalesce(min(position), 0) - 1000
    into   v_min_pos
    from   public.tasks
    where  workspace_id = new.workspace_id
      and  status = 'toDo';

    -- Track the root parent so chains link back to the original
    v_parent_id := coalesce(new.recurrence_parent_id, new.id);

    insert into public.tasks (
      workspace_id, project_id, text, description, status, priority,
      labels, assignee_id, due_date, due_time, position,
      recurrence, recurrence_parent_id
    ) values (
      new.workspace_id, new.project_id, new.text, new.description, 'toDo', new.priority,
      new.labels, new.assignee_id, v_next_due, new.due_time, v_min_pos,
      new.recurrence, v_parent_id
    );
  end if;

  return new;
end;
$$;

-- ── 3. Attach trigger ──────────────────────────────────────────────────────
drop trigger if exists on_task_recurrence on public.tasks;
create trigger on_task_recurrence
  after update on public.tasks
  for each row
  when (old.status is distinct from new.status)
  execute function public.handle_task_recurrence();
