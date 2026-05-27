-- Add content_type column to extracted_insights
-- Stores AI-classified content type: 'review' | 'help_request' | 'bug_report' | 'tutorial' | 'skip'
-- Only 'review' rows are surfaced in the frontend
ALTER TABLE extracted_insights
  ADD COLUMN IF NOT EXISTS content_type text;
