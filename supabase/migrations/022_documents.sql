create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title       text not null default 'Untitled',
  content     text,
  created_by  uuid references profiles(user_id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists documents_workspace_updated
  on documents (workspace_id, updated_at desc);

alter table documents enable row level security;

create policy "members can view workspace documents"
  on documents for select
  using (workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ));

create policy "members can create documents"
  on documents for insert
  with check (workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ));

create policy "members can update documents"
  on documents for update
  using (workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ));

create policy "owners and authors can delete documents"
  on documents for delete
  using (
    created_by = auth.uid()
    or workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role = 'owner'
    )
  );
