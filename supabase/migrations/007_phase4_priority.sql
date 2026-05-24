-- ─────────────────────────────────────────────────────────────────
-- Phase 4 · Priority
-- Run in Supabase SQL Editor after 006_phase4_labels.sql
-- ─────────────────────────────────────────────────────────────────

alter table public.tasks
  add column if not exists priority text
    check (priority in ('low', 'medium', 'high', 'urgent'));
