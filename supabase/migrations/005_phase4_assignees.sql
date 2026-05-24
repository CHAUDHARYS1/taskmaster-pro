-- ─────────────────────────────────────────────────────────────────
-- Phase 4 · Assignees
-- Run in Supabase SQL Editor after 004_phase4_task_detail.sql
-- ─────────────────────────────────────────────────────────────────

alter table public.tasks
  add column if not exists assignee_id uuid references public.profiles(id) on delete set null;
