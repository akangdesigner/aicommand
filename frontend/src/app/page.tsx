import { TOOLS, CATEGORIES, SORTS } from '@/lib/data'
import { HomePageClient } from '@/components/HomePage'

export default function Home() {
  return <HomePageClient tools={TOOLS} categories={CATEGORIES} sorts={SORTS} />
}
