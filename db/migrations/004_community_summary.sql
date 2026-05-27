-- Add community summary column to tools table
ALTER TABLE tools ADD COLUMN IF NOT EXISTS community_summary jsonb;
