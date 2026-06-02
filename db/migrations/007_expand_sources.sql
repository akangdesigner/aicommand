-- 007_expand_sources.sql
-- Expand raw_mentions.source CHECK to include v2ex, juejin, ithelp
-- Run in Supabase SQL Editor

ALTER TABLE raw_mentions DROP CONSTRAINT IF EXISTS raw_mentions_source_check;
ALTER TABLE raw_mentions ADD CONSTRAINT raw_mentions_source_check
  CHECK (source IN ('reddit', 'github', 'youtube', 'hn', 'ptt', 'dcard', 'threads', 'v2ex', 'juejin', 'ithelp'));
