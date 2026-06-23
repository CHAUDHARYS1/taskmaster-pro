-- Add start_time to tasks for time-range support
alter table public.tasks
  add column if not exists start_time text default null;
