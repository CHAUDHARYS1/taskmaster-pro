-- Migration 035: Workspace branding
--
-- color — hex string for the workspace avatar background. Defaults to
--         the existing accent blue so all current workspaces look unchanged.
-- emoji — optional single emoji shown instead of the first-letter initial.

alter table public.workspaces
  add column if not exists color text not null default '#2563EB';

alter table public.workspaces
  add column if not exists emoji text;
