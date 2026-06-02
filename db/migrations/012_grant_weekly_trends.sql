-- 012_grant_weekly_trends.sql
-- Grant SELECT on materialized view to anon/authenticated so frontend sparklines work
GRANT SELECT ON tool_weekly_trends TO anon, authenticated;
