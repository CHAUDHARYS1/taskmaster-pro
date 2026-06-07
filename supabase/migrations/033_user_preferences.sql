-- Migration 033: User Preferences
--
-- Adds a preferences JSONB column to profiles so each user can persist
-- display settings across devices. Defaults to an empty object; the app
-- fills in individual keys with its own defaults when the column is absent.
--
-- Shape (all keys optional, app supplies defaults):
--   defaultView  text    'board' | 'list' | 'calendar' | 'gantt'
--   cardDensity  text    'comfortable' | 'compact'
--   dateFormat   text    'relative' | 'absolute'
--   weekStart    integer  0 = Sunday, 1 = Monday

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;
