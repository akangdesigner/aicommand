import { CATEGORIES, SORTS } from '@/lib/data'
import { getToolsForHomePage } from '@/lib/supabase'
import { HomePageClient } from '@/components/HomePage'

export const revalidate = 3600 // 每小時重新抓一次排名

export default async function Home() {
  const tools = await getToolsForHomePage()
  return <HomePageClient tools={tools} categories={CATEGORIES} sorts={SORTS} />
}
