'use client'

import { useState, useEffect } from 'react'

const LAUNCH_DATE = new Date('2026-03-22T12:00:00Z')

function getTimeLeft() {
  const now = new Date()
  const diff = LAUNCH_DATE.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, text: 'Launching today!' }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return { days, hours, text: `${days} day${days !== 1 ? 's' : ''}, ${hours} hr${hours !== 1 ? 's' : ''} to go` }
  return { days: 0, hours, text: `${hours} hour${hours !== 1 ? 's' : ''} to go` }
}

function formatLaunchDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function LaunchBanner({ variant = 'banner' }: { variant?: 'banner' | 'badge' | 'subtle' }) {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, text: '' })

  useEffect(() => {
    setMounted(true)
    setTimeLeft(getTimeLeft())
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 60 * 1000)
    return () => clearInterval(t)
  }, [])

  if (!mounted) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-[#00D4FF]/50 text-[#00D4FF] bg-[#00D4FF]/10">
        Coming next week
      </span>
    )
  }

  if (variant === 'badge') {
    return (
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1">
        <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-[#00D4FF]/50 text-[#00D4FF] bg-[#00D4FF]/10">
          Launching {formatLaunchDate(LAUNCH_DATE)}
        </span>
        <span className="text-[10px] text-[#00D4FF]/80 font-medium tabular-nums">
          {timeLeft.text}
        </span>
      </div>
    )
  }

  if (variant === 'subtle') {
    return (
      <p className="text-xs text-[#4A6080] tabular-nums">
        Coming next week · <span className="text-[#00D4FF]/80">{timeLeft.text}</span>
      </p>
    )
  }

  return (
    <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]">
      <span className="text-sm font-semibold">Coming next week · Launching {formatLaunchDate(LAUNCH_DATE)}</span>
      <span className="text-xs font-medium tabular-nums opacity-90">{timeLeft.text}</span>
    </div>
  )
}
