-- ============================================================
-- Migration 003: Sync tools table + expand source CHECK
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Expand raw_mentions.source CHECK to include all crawlers
ALTER TABLE raw_mentions DROP CONSTRAINT IF EXISTS raw_mentions_source_check;
ALTER TABLE raw_mentions ADD CONSTRAINT raw_mentions_source_check
  CHECK (source IN ('reddit', 'github', 'youtube', 'hn', 'ptt', 'dcard', 'threads'));

-- 2. Add source attribution columns to extracted_insights (needed by routes.py)
ALTER TABLE extracted_insights
  ADD COLUMN IF NOT EXISTS source_url     TEXT,
  ADD COLUMN IF NOT EXISTS source_author  TEXT,
  ADD COLUMN IF NOT EXISTS source_platform TEXT;

-- 3. Sync tools table to match the 5 tools in frontend/src/lib/data.ts
--    Remove tools not tracked by the frontend
DELETE FROM tools WHERE slug NOT IN ('claude-code', 'cursor', 'trae', 'windsurf', 'codex');

--    Add trae and codex which are in frontend but weren't in the original seed
INSERT INTO tools (slug, name, category, official_url) VALUES
  ('trae',  'Trae',  'coding', 'https://www.trae.ai'),
  ('codex', 'Codex', 'coding', 'https://openai.com/codex')
ON CONFLICT (slug) DO NOTHING;
