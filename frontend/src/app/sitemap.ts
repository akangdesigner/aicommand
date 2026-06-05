import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://aicommand.aiqkangber.com'

// 每小時重新產生，讓新加入 DB 的工具自動進 sitemap（免重新 build）
export const revalidate = 3600

async function getToolSlugs(): Promise<string[]> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    )
    const { data } = await sb.from('tools').select('slug').order('heat_score', { ascending: false })
    return (data ?? []).map((r: { slug: string }) => r.slug).filter(Boolean)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getToolSlugs()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,            lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/news`,  lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/glossary`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/faq`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const toolPages: MetadataRoute.Sitemap = slugs.map(slug => ({
    url: `${BASE}/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...toolPages]
}
