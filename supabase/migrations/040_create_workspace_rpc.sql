-- ─────────────────────────────────────────────────────────────────
-- Fix: re-add the create_workspace RPC as a proper migration.
--
-- The function was originally created by hand in the Supabase SQL
-- editor (see commit 3736465, "Fix workspace creation via
-- security-definer RPC function") and never captured in a migration
-- file. Because it lived outside version control, it never picked up
-- later schema changes — most importantly it was not guaranteed to
-- insert an 'owner' row into workspace_members for every workspace a
-- user creates. That's why the "Archive done" button (which is
-- gated on userRole === 'owner', see Board.jsx) only ever showed up
-- on the default personal workspace and whichever workspace happened
-- to get an owner row some other way (e.g. via the
-- on_workspace_created trigger racing the RPC) — every workspace
-- after that silently fell back to role 'member'.
--
-- This migration restores the function with an explicit, atomic
-- owner insert so every newly created workspace reliably grants
-- ownership to its creator, and backfills any workspace that is
-- currently missing its owner membership row.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.create_workspace(workspace_name text)
returns public.workspaces
language plpgsql
security definer
as $$
declare
  v_workspace public.workspaces;
begin
  insert into public.workspaces (name, owner_id)
  values (workspace_name, auth.uid())
  returning * into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace.id, auth.uid(), 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';

  return v_workspace;
end;
$$;

-- Backfill: make sure every workspace owner actually has an 'owner'
-- row in workspace_members, in case earlier workspace creations were
-- affected by the missing-migration bug above.
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'owner'
from public.workspaces w
on conflict (workspace_id, user_id) do update set role = 'owner';
