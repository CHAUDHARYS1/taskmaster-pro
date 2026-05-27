alter table tasks          add column if not exists due_time text;
alter table archived_tasks add column if not exists due_time text;
