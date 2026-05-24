-- ─────────────────────────────────────────────────────────────────
-- Phase 4 · Task detail panel — description + comments
-- Run in Supabase SQL Editor after 003_phase3_cron.sql
-- ─────────────────────────────────────────────────────────────────

-- Add description to tasks
alter table public.tasks add column if not exists description text;

-- Comments table — user_id references profiles so PostgREST can join
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references public.tasks(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  body       text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

-- Visible to anyone who is a member of the task's workspace
create policy "workspace members can view comments"
  on public.comments for select
  using (
    exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = comments.task_id
        and wm.user_id = auth.uid()
    )
  );

-- Members and owners can add comments
create policy "workspace members can add comments"
  on public.comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = comments.task_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'member')
    )
  );

-- Authors can delete their own comments
create policy "users can delete their own comments"
  on public.comments for delete
  using (user_id = auth.uid());
