-- 015_add_tools.sql
-- 新增工具：語音（ElevenLabs/Suno/Udio）、影片生成（Runway/Sora/Pika/Veo/Hailuo）、
-- 程式開發（GitHub Copilot/Replit/Aider/Cline/Bolt/Lovable/Devin）
-- slug 必須等於 lower(replace(name, ' ', '-'))，scorer 才能對應
-- Run in Supabase SQL Editor（或由 pipeline 直接寫入）

INSERT INTO tools (slug, name, category, description, official_url) VALUES
  -- 程式開發
  ('github-copilot', 'GitHub Copilot', 'coding', 'GitHub 的 AI 程式碼補全與對話助手',        'https://github.com/features/copilot'),
  ('replit',         'Replit',         'coding', '雲端 IDE，內建 AI Agent 協助開發',          'https://replit.com'),
  ('aider',          'Aider',          'coding', '終端機 AI 結對程式設計工具',                'https://aider.chat'),
  ('cline',          'Cline',          'coding', 'VS Code 內的自主編碼 Agent',               'https://cline.bot'),
  ('bolt',           'Bolt',           'coding', '瀏覽器內全端 AI 應用生成',                  'https://bolt.new'),
  ('lovable',        'Lovable',        'coding', '對話式生成全端 Web 應用',                   'https://lovable.dev'),
  ('devin',          'Devin',          'coding', 'Cognition 的自主 AI 軟體工程師',            'https://devin.ai'),
  -- 影片生成
  ('runway',         'Runway',         'video',  'Gen 系列 AI 影片生成與編輯',                'https://runwayml.com'),
  ('sora',           'Sora',           'video',  'OpenAI 文字轉影片模型',                     'https://openai.com/sora'),
  ('pika',           'Pika',           'video',  'AI 影片生成與特效平台',                     'https://pika.art'),
  ('veo',            'Veo',            'video',  'Google DeepMind 文字轉影片模型',            'https://deepmind.google/technologies/veo'),
  ('hailuo',         'Hailuo',         'video',  'MiniMax 海螺 AI 影片生成',                  'https://hailuoai.video'),
  -- 語音
  ('elevenlabs',     'ElevenLabs',     'voice',  'AI 語音合成與配音',                         'https://elevenlabs.io'),
  ('suno',           'Suno',           'voice',  'AI 音樂與歌曲生成',                         'https://suno.com'),
  ('udio',           'Udio',           'voice',  'AI 音樂生成平台',                           'https://udio.com')
ON CONFLICT (slug) DO NOTHING;
