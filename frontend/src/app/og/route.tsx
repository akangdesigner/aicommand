import { ImageResponse } from 'next/og'

// 動態產生 OG 圖片（1200×630），取代不存在的 /og-default.png。
// 放在 /og（非 /api）→ robots 允許爬蟲抓取，Ahrefs 不會判定 og:image 被封鎖。
// 圖片內文字一律用英文/工具名（拉丁字元），避免 edge 環境缺 CJK 字型而出現空白。
export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') || 'AICommand').slice(0, 48)
  const isBrand = title === 'AICommand'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 60%, #1c1917 100%)',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ color: '#e7e5e4', fontSize: 30, fontWeight: 600, letterSpacing: -1 }}>
            AICommand
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              color: 'white',
              fontSize: isBrand ? 76 : 88,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          <div style={{ color: '#a8a29e', fontSize: 32, fontWeight: 500 }}>
            {isBrand
              ? 'AI Tool Rankings from Real Community Discussions'
              : 'Community reviews, sentiment & heat score'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, color: '#78716c', fontSize: 24 }}>
          <span>Reddit</span>
          <span>·</span>
          <span>Hacker News</span>
          <span>·</span>
          <span>PTT</span>
          <span>·</span>
          <span>Dcard</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
