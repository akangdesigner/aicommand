-- 013_add_video_category.sql
-- Add 'video' to tools category constraint for Kling, Seedance etc.
ALTER TABLE tools DROP CONSTRAINT tools_category_check;
ALTER TABLE tools ADD CONSTRAINT tools_category_check
  CHECK (category = ANY (ARRAY['coding','image','video','writing','automation','data','voice','other']));
