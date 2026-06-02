-- 011_heat_score.sql
-- Add heat_score column (0-100 normalized) to tools table
-- heat_score is computed after all tools are scored: heat = ranking_score / max * 100

ALTER TABLE tools ADD COLUMN IF NOT EXISTS heat_score NUMERIC(5,1) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tools_heat_score ON tools (heat_score DESC);
