import { CATEGORIES, SORTS } from '@/lib/data'
import { getToolsForHomePage, getRecentDiscussions } from '@/lib/supabase'
import { HomePageClient } from '@/components/HomePage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [tools, discussions] = await Promise.all([
    getToolsForHomePage(),
    getRecentDiscussions(24),
  ])
  return <HomePageClient tools={tools} categories={CATEGORIES} sorts={SORTS} discussions={discussions} />
}
