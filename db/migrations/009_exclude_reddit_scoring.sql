-- 009_exclude_reddit_scoring.sql
-- Exclude Reddit from scoring (Reddit is down, only old tools have Reddit data → unfair)

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
    AND r.source != 'reddit'
    AND r.crawled_at > NOW() - INTERVAL '30 days';

  UPDATE tools
  SET
    ranking_score  = COALESCE(v_score, 0),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
