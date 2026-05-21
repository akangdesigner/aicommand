import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Noto_Sans_TC } from 'next/font/google'
import { TopNav } from '@/components/TopNav'
import './globals.css'

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AICommand · AI 工具排行榜',
  description: '從 Reddit、Hacker News、GitHub 上的真實社群討論分析 AI 工具排名——不是廠商買位，而是真實聲量。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${GeistSans.variable} ${GeistMono.variable} ${notoSansTC.variable}`}>
      <body className="min-h-screen bg-[#FBFBF9] text-stone-900">
        <TopNav />
        {children}
      </body>
    </html>
  )
}
