alter table workspaces
  add column if not exists column_labels jsonb not null default '{}'::jsonb;
