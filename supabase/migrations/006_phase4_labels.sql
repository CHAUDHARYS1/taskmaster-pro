-- ─────────────────────────────────────────────────────────────────
-- Phase 4 · Labels
-- Run in Supabase SQL Editor after 005_phase4_assignees.sql
-- ─────────────────────────────────────────────────────────────────

alter table public.tasks
  add column if not exists labels text[] not null default '{}';
