-- Allow user-defined board columns by removing the hardcoded status check constraint.
-- Column definitions are now stored in workspaces.column_labels (_columns key).
alter table public.tasks drop constraint if exists tasks_status_check;
