'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const update = () => {
      const pct = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight) * 100
      bar.style.width = `${Math.min(pct, 100)}%`
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (pathname === '/') return null

  return (
    <div className="sticky top-14 z-10 h-[3px] w-full bg-stone-100">
      <div ref={barRef} className="h-full transition-[width] duration-100"
        style={{ width: '0%', background: 'oklch(0.55 0.18 265)' }} />
    </div>
  )
}
