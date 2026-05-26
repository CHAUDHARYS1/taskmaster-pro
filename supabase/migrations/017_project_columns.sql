-- Add enabled_columns to projects so owners can show/hide status columns per project
alter table projects
  add column if not exists enabled_columns text[]
    default array['toDo','inProgress','inReview','done'];
