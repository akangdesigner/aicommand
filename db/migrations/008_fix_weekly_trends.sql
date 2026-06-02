-- 008_fix_weekly_trends.sql
-- 1. Backfill NULL posted_at using metadata.created_at (for github issue/discussion comments)
UPDATE raw_mentions
SET posted_at = (metadata->>'created_at')::timestamptz
WHERE posted_at IS NULL
  AND metadata->>'created_at' IS NOT NULL
  AND metadata->>'created_at' != '';

-- 2. Remaining NULLs → use crawled_at
UPDATE raw_mentions
SET posted_at = crawled_at
WHERE posted_at IS NULL;

-- 3. Add unique index so REFRESH CONCURRENTLY works
CREATE UNIQUE INDEX IF NOT EXISTS tool_weekly_trends_pk
  ON tool_weekly_trends (week, tool_name);

-- 4. Refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY tool_weekly_trends;
