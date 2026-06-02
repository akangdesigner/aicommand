import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Noto_Sans_TC, Source_Serif_4 } from 'next/font/google'
import { TopNav } from '@/components/TopNav'
import { ReadingProgress } from '@/components/ReadingProgress'
import './globals.css'

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400'],
  variable: '--font-source-serif',
  display: 'swap',
})

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
})

const BASE_URL = 'https://aicommand.aiqkangber.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'AICommand · AI 工具排行榜',
    template: '%s · AICommand',
  },
  description: '從 Reddit、Hacker News、PTT、Dcard 的真實社群討論分析 AI 工具排名。每週更新，不是廠商買位，而是真實聲量。',
  keywords: ['AI 工具', 'AI 排行榜', 'AI 程式開發', 'Cursor', 'Claude Code', 'GitHub Copilot', 'Vibe Coding', 'AI IDE'],
  authors: [{ name: 'AICommand 編輯部', url: BASE_URL }],
  creator: 'AICommand',
  publisher: 'AICommand',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: BASE_URL,
    siteName: 'AICommand',
    title: 'AICommand · AI 工具排行榜',
    description: '從真實社群討論分析 AI 工具排名，每週更新，不是廠商買位。',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'AICommand AI 工具排行榜' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AICommand · AI 工具排行榜',
    description: '從真實社群討論分析 AI 工具排名，每週更新。',
    images: ['/og-default.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AICommand',
  url: BASE_URL,
  description: '從 Reddit、Hacker News、PTT、Dcard 的真實社群討論分析 AI 工具排名',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'AICommand',
    url: BASE_URL,
    contactPoint: { '@type': 'ContactPoint', email: 'asdtodd42@gmail.com', contactType: 'customer service' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${GeistSans.variable} ${GeistMono.variable} ${notoSansTC.variable} ${sourceSerif4.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#FBFBF9] text-stone-900">
        <TopNav />
        <ReadingProgress />
        {children}
      </body>
    </html>
  )
}
