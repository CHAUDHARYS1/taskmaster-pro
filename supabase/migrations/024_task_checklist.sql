-- ─────────────────────────────────────────────────────────────────
-- Migration 024 · Task checklist items
-- Run in Supabase SQL Editor after 023_task_documents.sql
-- ─────────────────────────────────────────────────────────────────

create table public.task_checklist_items (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references public.tasks(id) on delete cascade not null,
  text       text not null,
  checked    boolean not null default false,
  position   float not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.task_checklist_items enable row level security;

-- Visible to anyone who is a member of the task's workspace
create policy "workspace members can view checklist items"
  on public.task_checklist_items for select
  using (
    exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = task_checklist_items.task_id
        and wm.user_id = auth.uid()
    )
  );

-- Members and owners can add checklist items
create policy "workspace members can add checklist items"
  on public.task_checklist_items for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = task_checklist_items.task_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'member')
    )
  );

-- Members and owners can update checklist items (e.g. toggle checked)
create policy "workspace members can update checklist items"
  on public.task_checklist_items for update
  using (
    exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = task_checklist_items.task_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'member')
    )
  );

-- Members and owners can delete checklist items
create policy "workspace members can delete checklist items"
  on public.task_checklist_items for delete
  using (
    exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = task_checklist_items.task_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'member')
    )
  );
