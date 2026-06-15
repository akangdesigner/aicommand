import type { Metadata } from 'next'
import { FAQ_CATEGORIES } from '@/lib/faq'
import { FaqPage } from '@/components/FaqPage'

export const metadata: Metadata = {
  title: '常見問題 FAQ',
  description: '關於 AICommand 排名計算、資料來源、使用方式的常見問題解答。排名如何計算？資料來自哪裡？廠商會付費上榜嗎？',
  alternates: { canonical: 'https://aicommand.aiqkangber.com/faq' },
  openGraph: {
    title: '常見問題 FAQ · AICommand',
    description: '關於 AI 工具排行榜排名計算、資料來源的常見問題。',
  },
}

export default function Page() {
  const allQs = FAQ_CATEGORIES.flatMap((c) => c.questions)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allQs.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <FaqPage categories={FAQ_CATEGORIES} />
    </>
  )
}
