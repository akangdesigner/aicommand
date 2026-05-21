import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { TOOLS } from '@/lib/data'
import { DetailPageClient } from '@/components/DetailPage'

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tool = TOOLS.find((t) => t.slug === params.slug)
  if (!tool) return {}
  return {
    title: `${tool.name} · AICommand`,
    description: tool.description,
  }
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = TOOLS.find((t) => t.slug === params.slug)
  if (!tool) notFound()
  return <DetailPageClient tool={tool} allTools={TOOLS} />
}
