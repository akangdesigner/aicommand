-- 014_user_reviews.sql
-- User-submitted reviews shown as community discussions, source = 本站
CREATE TABLE user_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_slug text NOT NULL,
  tool_name text NOT NULL,
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 1000),
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  author_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX user_reviews_tool_slug_idx ON user_reviews (tool_slug);
CREATE INDEX user_reviews_created_at_idx ON user_reviews (created_at DESC);

ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "anyone can insert" ON user_reviews FOR INSERT WITH CHECK (
  char_length(content) >= 10 AND char_length(content) <= 1000
);
