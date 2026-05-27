-- Add source attribution columns to extracted_insights
-- Run in Supabase SQL Editor
ALTER TABLE extracted_insights
  ADD COLUMN IF NOT EXISTS source_url    TEXT,
  ADD COLUMN IF NOT EXISTS source_author TEXT,
  ADD COLUMN IF NOT EXISTS source_platform TEXT;
