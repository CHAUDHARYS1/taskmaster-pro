-- Add preview (snippet) and pinned flag to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS preview TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
