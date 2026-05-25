-- Migration 011: per-workspace custom labels
-- Replaces the hardcoded label list in src/lib/labels.js with a DB table
-- so each workspace can define its own set of labels.

create table public.workspace_labels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name         text not null,
  color        text not null,
  created_at   timestamptz default now()
);

alter table public.workspace_labels enable row level security;

create policy "workspace members can view labels"
  on public.workspace_labels for select
  using (workspace_id in (select public.get_my_workspace_ids()));

create policy "workspace members can create labels"
  on public.workspace_labels for insert
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'member')
    )
  );

create policy "workspace members can delete labels"
  on public.workspace_labels for delete
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'member')
    )
  );
