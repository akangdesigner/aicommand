-- ============================================================
-- AI Tool Discovery Engine — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable pgvector for future semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Table 1: Raw crawled content (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS raw_mentions (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL CHECK (source IN ('reddit', 'github', 'youtube', 'hn')),
  source_id    TEXT NOT NULL,
  content      TEXT,
  metadata     JSONB DEFAULT '{}',
  crawled_at   TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,
  UNIQUE (source, source_id)
);

CREATE INDEX idx_raw_mentions_source_crawled ON raw_mentions (source, crawled_at DESC);
CREATE INDEX idx_raw_mentions_hash ON raw_mentions (content_hash);

-- ============================================================
-- Table 2: AI-extracted structured insights
-- ============================================================
CREATE TABLE IF NOT EXISTS extracted_insights (
  id              BIGSERIAL PRIMARY KEY,
  raw_mention_id  BIGINT REFERENCES raw_mentions(id) ON DELETE CASCADE,
  tool_name       TEXT NOT NULL,
  sentiment       TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  use_cases       TEXT[] DEFAULT '{}',
  pain_points     TEXT[] DEFAULT '{}',
  target_audience TEXT[] DEFAULT '{}',
  pricing_signal  TEXT,
  comparisons     JSONB DEFAULT '[]',
  confidence      NUMERIC(3,2),
  raw_quote       TEXT,
  extracted_at    TIMESTAMPTZ DEFAULT NOW(),
  model_used      TEXT DEFAULT 'claude-haiku-4-5'
);

CREATE INDEX idx_insights_tool_name ON extracted_insights (tool_name, extracted_at DESC);
CREATE INDEX idx_insights_sentiment ON extracted_insights (sentiment);

-- ============================================================
-- Table 3: Tool profiles (aggregated, frontend-facing)
-- ============================================================
CREATE TABLE IF NOT EXISTS tools (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT CHECK (category IN ('coding', 'image', 'writing', 'automation', 'data', 'voice', 'other')),
  description     TEXT,
  official_url    TEXT,
  logo_url        TEXT,
  ranking_score   NUMERIC(6,2) DEFAULT 0,
  mention_count   INT DEFAULT 0,
  sentiment_score NUMERIC(4,3) DEFAULT 0,  -- -1.0 to 1.0
  trend_delta     NUMERIC(6,2) DEFAULT 0,  -- this week vs last week
  last_scored_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tools_ranking ON tools (ranking_score DESC);
CREATE INDEX idx_tools_category ON tools (category);

-- ============================================================
-- Materialized View: Weekly trends
-- Refresh daily via n8n: REFRESH MATERIALIZED VIEW CONCURRENTLY tool_weekly_trends
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS tool_weekly_trends AS
  SELECT
    date_trunc('week', r.crawled_at)::DATE AS week,
    e.tool_name,
    COUNT(*)                                AS mention_count,
    AVG(CASE
      WHEN e.sentiment = 'positive' THEN 1.0
      WHEN e.sentiment = 'negative' THEN -1.0
      ELSE 0.0
    END)                                    AS avg_sentiment
  FROM extracted_insights e
  JOIN raw_mentions r ON e.raw_mention_id = r.id
  GROUP BY 1, 2
  WITH DATA;

CREATE UNIQUE INDEX ON tool_weekly_trends (week, tool_name);

-- ============================================================
-- Function: Recalculate ranking score for a tool
-- Called by n8n daily or after bulk extraction
-- Formula inspired by HN ranking algorithm
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_tool_score(p_tool_name TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC;
BEGIN
  SELECT
    ROUND(
      POWER(COUNT(*), 0.8)
      * AVG(CASE
          WHEN e.sentiment = 'positive' THEN 1.2
          WHEN e.sentiment = 'negative' THEN 0.7
          ELSE 1.0
        END)
      * (1 + 0.5 * SUM(CASE WHEN r.crawled_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0))
    , 2)
  INTO v_score
  FROM extracted_insights e
  JOIN raw_mentions r ON e.raw_mention_id = r.id
  WHERE e.tool_name = p_tool_name
    AND r.crawled_at > NOW() - INTERVAL '30 days';

  UPDATE tools
  SET
    ranking_score  = COALESCE(v_score, 0),
    mention_count  = (
      SELECT COUNT(*) FROM extracted_insights e2
      JOIN raw_mentions r2 ON e2.raw_mention_id = r2.id
      WHERE e2.tool_name = p_tool_name
        AND r2.crawled_at > NOW() - INTERVAL '30 days'
    ),
    sentiment_score = (
      SELECT AVG(CASE
        WHEN sentiment = 'positive' THEN 1.0
        WHEN sentiment = 'negative' THEN -1.0
        ELSE 0.0 END)
      FROM extracted_insights WHERE tool_name = p_tool_name
    ),
    last_scored_at = NOW()
  WHERE slug = lower(replace(p_tool_name, ' ', '-'));

  RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Seed: Initial tool list (can expand later)
-- ============================================================
INSERT INTO tools (slug, name, category, official_url) VALUES
  ('claude',          'Claude',           'coding',     'https://claude.ai'),
  ('claude-code',     'Claude Code',      'coding',     'https://claude.ai/code'),
  ('cursor',          'Cursor',           'coding',     'https://cursor.com'),
  ('github-copilot',  'GitHub Copilot',   'coding',     'https://github.com/features/copilot'),
  ('chatgpt',         'ChatGPT',          'writing',    'https://chatgpt.com'),
  ('perplexity',      'Perplexity',       'writing',    'https://perplexity.ai'),
  ('midjourney',      'Midjourney',       'image',      'https://midjourney.com'),
  ('n8n',             'n8n',              'automation', 'https://n8n.io'),
  ('make',            'Make',             'automation', 'https://make.com'),
  ('windsurf',        'Windsurf',         'coding',     'https://codeium.com/windsurf'),
  ('v0',              'v0 by Vercel',     'coding',     'https://v0.dev'),
  ('bolt',            'Bolt',             'coding',     'https://bolt.new'),
  ('replit',          'Replit',           'coding',     'https://replit.com'),
  ('lovable',         'Lovable',          'coding',     'https://lovable.dev'),
  ('gemini',          'Gemini',           'writing',    'https://gemini.google.com'),
  ('stable-diffusion','Stable Diffusion', 'image',      'https://stability.ai'),
  ('runway',          'Runway',           'image',      'https://runwayml.com'),
  ('elevenlabs',      'ElevenLabs',       'voice',      'https://elevenlabs.io'),
  ('dify',            'Dify',             'automation', 'https://dify.ai'),
  ('langchain',       'LangChain',        'automation', 'https://langchain.com')
ON CONFLICT (slug) DO NOTHING;
