import { CATEGORIES, SORTS } from '@/lib/data'
import { getToolsForHomePage } from '@/lib/supabase'
import { HomePageClient } from '@/components/HomePage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const tools = await getToolsForHomePage()
  return <HomePageClient tools={tools} categories={CATEGORIES} sorts={SORTS} />
}
