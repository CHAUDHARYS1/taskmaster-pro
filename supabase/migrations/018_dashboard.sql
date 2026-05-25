-- Add completed_at timestamp to tasks so we can track when each task was finished
alter table tasks
  add column if not exists completed_at timestamptz;

-- Trigger: set completed_at when status changes to 'done', clear it when moved back
create or replace function handle_task_completion()
returns trigger language plpgsql as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done') then
    new.completed_at = now();
  elsif new.status != 'done' and old.status = 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_task_completion on tasks;
create trigger on_task_completion
  before update on tasks
  for each row
  when (old.status is distinct from new.status)
  execute function handle_task_completion();

-- Backfill: approximate completed_at for existing done tasks using updated_at
update tasks
  set completed_at = updated_at
  where status = 'done'
    and completed_at is null
    and updated_at is not null;
