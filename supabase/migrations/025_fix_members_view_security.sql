-- ─────────────────────────────────────────────────────────────────
-- Migration 025 · Fix workspace_members_view security
--
-- The view was implicitly created with SECURITY DEFINER, meaning it
-- ran with the privileges of the view owner (superuser) and bypassed
-- RLS on the underlying tables. This is flagged as a critical issue
-- by the Supabase linter.
--
-- Fix: recreate with security_invoker = true so queries execute with
-- the calling user's privileges and RLS is enforced on both
-- workspace_members (scoped to the user's workspaces) and profiles
-- (any authenticated user can read — existing policy).
-- ─────────────────────────────────────────────────────────────────

create or replace view public.workspace_members_view
  with (security_invoker = true)
as
select
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.joined_at,
  p.email,
  p.first_name,
  p.last_name
from public.workspace_members wm
join public.profiles p on p.id = wm.user_id;
