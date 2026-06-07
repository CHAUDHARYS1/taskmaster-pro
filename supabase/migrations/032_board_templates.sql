-- Migration 032: Board Templates
--
-- Saves a named snapshot of a project's tasks as a reusable template.
-- Templates are workspace-scoped. Applying a template bulk-inserts
-- new tasks into any project in the same workspace (additive, non-destructive).

-- ── 1. Tables ──────────────────────────────────────────────────────────────

create table if not exists public.board_templates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.board_template_tasks (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.board_templates(id) on delete cascade,
  text        text not null,
  description text,
  status      text not null default 'toDo',
  priority    text,
  labels      text[],
  position    float8 not null default 0
);

-- ── 2. RLS — board_templates ───────────────────────────────────────────────

alter table public.board_templates enable row level security;

create policy "workspace members can view templates"
  on public.board_templates for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = board_templates.workspace_id
        and user_id = auth.uid()
    )
  );

create policy "workspace members can create templates"
  on public.board_templates for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.workspace_members
      where workspace_id = board_templates.workspace_id
        and user_id = auth.uid()
    )
  );

create policy "creator or owner can delete templates"
  on public.board_templates for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.workspace_members
      where workspace_id = board_templates.workspace_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- ── 3. RLS — board_template_tasks ─────────────────────────────────────────

alter table public.board_template_tasks enable row level security;

create policy "template tasks visible if template is visible"
  on public.board_template_tasks for select
  using (
    exists (
      select 1 from public.board_templates bt
      join  public.workspace_members wm on wm.workspace_id = bt.workspace_id
      where bt.id = template_id
        and wm.user_id = auth.uid()
    )
  );

create policy "can insert template tasks if member of template workspace"
  on public.board_template_tasks for insert
  with check (
    exists (
      select 1 from public.board_templates bt
      join  public.workspace_members wm on wm.workspace_id = bt.workspace_id
      where bt.id = template_id
        and wm.user_id = auth.uid()
    )
  );

create policy "can delete template tasks if can delete template"
  on public.board_template_tasks for delete
  using (
    exists (
      select 1 from public.board_templates bt
      where bt.id = template_id
        and (
          bt.created_by = auth.uid()
          or exists (
            select 1 from public.workspace_members
            where workspace_id = bt.workspace_id
              and user_id = auth.uid()
              and role = 'owner'
          )
        )
    )
  );
