ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS quick_links JSONB NOT NULL DEFAULT '[]'::jsonb;
