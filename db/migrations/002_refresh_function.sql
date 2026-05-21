-- Helper function for n8n to call via Supabase RPC
-- n8n: POST /rest/v1/rpc/refresh_weekly_trends
CREATE OR REPLACE FUNCTION refresh_weekly_trends()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tool_weekly_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
