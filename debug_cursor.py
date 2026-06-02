from dotenv import load_dotenv; load_dotenv()
from supabase import create_client
import os
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])

r = sb.from_('extracted_insights').select('id,raw_mention_id,sentiment,confidence,raw_quote').ilike('tool_name','Cursor').lt('confidence',0.95).limit(20).execute()
print('Cursor insights (conf<0.95):', len(r.data))
for row in r.data[:5]:
    print(f"  raw_mention_id={row['raw_mention_id']} sent={row['sentiment']} conf={row['confidence']} quote={str(row['raw_quote'])[:80]}")

r2 = sb.from_('raw_mentions').select('id,source').like('content','%Cursor%').order('crawled_at', desc=True).limit(80).execute()
rm_ids = {row['id'] for row in r2.data}
print(f'\nFrontend raw_mentions (case-sensitive Cursor): {len(r2.data)}')

if r.data:
    insight_rm_ids = [row['raw_mention_id'] for row in r.data]
    matches = [mid for mid in insight_rm_ids if mid in rm_ids]
    print(f'Insight IDs that appear in frontend fetch: {len(matches)}/{len(insight_rm_ids)}')
    print('Sample insight raw_mention_ids:', insight_rm_ids[:5])
    print('Sample frontend rm ids:', list(rm_ids)[:5])
