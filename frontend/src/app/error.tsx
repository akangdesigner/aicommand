'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-stone-600">
      <p className="text-[15px]">載入時發生錯誤</p>
      <button onClick={reset} className="rounded-full bg-stone-900 px-4 py-1.5 text-[13px] text-white">
        重試
      </button>
    </div>
  )
}
