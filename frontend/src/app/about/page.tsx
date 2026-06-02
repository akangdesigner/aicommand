import type { Metadata } from 'next'
import { AboutPage } from '@/components/AboutPage'

export const metadata: Metadata = {
  title: '關於 AICommand',
  description: 'AICommand 是台灣第一個以社群聲量為核心的 AI 工具排行榜。爬蟲抓取 HN、PTT、Dcard、Threads 的真實討論，AI 分析情緒後產出排名，不接受廠商贊助。',
  alternates: { canonical: 'https://aicommand.aiqkangber.com/about' },
  openGraph: {
    title: '關於 AICommand · 真實社群驅動的 AI 工具排行榜',
    description: '不靠廠商贊助、不靠人工評測，所有排名來自真實社群討論。',
  },
}

export default function About() {
  return <AboutPage />
}
