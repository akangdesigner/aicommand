-- 006_posted_at.sql
-- Add posted_at to store original post time (vs crawled_at which is DB insertion time)
-- This enables tool_weekly_trends to show real historical distribution

-- 1. Add column
ALTER TABLE raw_mentions ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- 2. Backfill: Reddit uses created_utc (unix seconds)
UPDATE raw_mentions
SET posted_at = to_timestamp((metadata->>'created_utc')::numeric)
WHERE source = 'reddit'
  AND (metadata->>'created_utc') IS NOT NULL
  AND (metadata->>'created_utc')::numeric > 0
  AND posted_at IS NULL;

-- 3. Backfill: HN / GitHub / others use created_at (ISO 8601)
UPDATE raw_mentions
SET posted_at = (metadata->>'created_at')::timestamptz
WHERE source IN ('hn', 'github', 'dcard', 'ptt', 'threads', 'v2ex', 'juejin')
  AND metadata->>'created_at' IS NOT NULL
  AND metadata->>'created_at' != ''
  AND posted_at IS NULL;

-- 4. Fallback: anything still null → use crawled_at
UPDATE raw_mentions
SET posted_at = crawled_at
WHERE posted_at IS NULL;

-- 5. Rebuild tool_weekly_trends with posted_at
DROP MATERIALIZED VIEW IF EXISTS tool_weekly_trends;

CREATE MATERIALIZED VIEW tool_weekly_trends AS
SELECT
  date_trunc('week', COALESCE(r.posted_at, r.crawled_at))::DATE AS week,
  e.tool_name,
  COUNT(*)                                                         AS mention_count,
  AVG(CASE
    WHEN e.sentiment = 'positive' THEN  1.0
    WHEN e.sentiment = 'negative' THEN -1.0
    ELSE 0.0 END)                                                  AS avg_sentiment
FROM extracted_insights e
JOIN raw_mentions r ON e.raw_mention_id = r.id
WHERE COALESCE(r.posted_at, r.crawled_at) > NOW() - INTERVAL '90 days'
GROUP BY 1, 2
ORDER BY 1, 2;

-- 6. Refresh immediately
REFRESH MATERIALIZED VIEW tool_weekly_trends;
