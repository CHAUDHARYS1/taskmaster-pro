create table if not exists task_documents (
  task_id     uuid not null references tasks(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  linked_at   timestamptz not null default now(),
  primary key (task_id, document_id)
);

alter table task_documents enable row level security;

create policy "members can view task documents"
  on task_documents for select
  using (task_id in (
    select id from tasks where workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  ));

create policy "members can link documents"
  on task_documents for insert
  with check (task_id in (
    select id from tasks where workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  ));

create policy "members can unlink documents"
  on task_documents for delete
  using (task_id in (
    select id from tasks where workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  ));
