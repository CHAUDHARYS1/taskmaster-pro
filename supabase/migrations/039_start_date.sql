-- Add start_date to tasks for date-range support
alter table public.tasks
  add column if not exists start_date date default null;
