-- 清空所有爬蟲與分析資料，重新 seed 5 款目標工具
-- Run in Supabase SQL Editor

TRUNCATE raw_mentions, extracted_insights RESTART IDENTITY CASCADE;
DELETE FROM tools;

ALTER TABLE tools ADD COLUMN IF NOT EXISTS official_info JSONB DEFAULT '{}';

INSERT INTO tools (slug, name, category, official_url) VALUES
  ('claude-code', 'Claude Code', 'coding', 'https://claude.ai/code'),
  ('cursor',      'Cursor',      'coding', 'https://cursor.com'),
  ('trae',        'Trae',        'coding', 'https://trae.ai'),
  ('windsurf',    'Windsurf',    'coding', 'https://codeium.com/windsurf'),
  ('codex',       'Codex',       'coding', 'https://openai.com/codex');
