alter table workspaces
  add column if not exists auto_save boolean not null default false;
