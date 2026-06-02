-- 010_score_history.sql
-- Store weekly score snapshots for trend chart

CREATE TABLE IF NOT EXISTS tool_score_history (
  id        BIGSERIAL PRIMARY KEY,
  tool_name TEXT NOT NULL,
  week      DATE NOT NULL,
  score     NUMERIC(6,2) NOT NULL DEFAULT 0,
  UNIQUE (tool_name, week)
);

CREATE INDEX IF NOT EXISTS idx_score_history_tool_week
  ON tool_score_history (tool_name, week DESC);
