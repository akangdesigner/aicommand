import type { MetadataRoute } from 'next'
import { getIndexableToolSlugs } from '@/lib/toolIndex'

const BASE = 'https://aicommand.aiqkangber.com'

// 每小時重新產生，讓新加入 DB 的工具自動進 sitemap（免重新 build）
export const revalidate = 3600

async function getToolSlugs(): Promise<string[]> {
  try {
    // 只收錄評論數達門檻的工具，薄頁不進 sitemap（E-E-A-T）
    return await getIndexableToolSlugs()
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
