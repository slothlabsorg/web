'use client'

import { useState, useEffect } from 'react'

const DEFAULT_LAUNCH = new Date('2026-06-12T12:00:00Z')
const DEFAULT_ACCENT = '#00D4FF'

function getTimeLeft(target: Date) {
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, text: 'Live now', isLive: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return { days, hours, minutes, text: `${days} day${days !== 1 ? 's' : ''}, ${hours} hr${hours !== 1 ? 's' : ''} to go`, isLive: false }
  if (hours > 0) return { days: 0, hours, minutes, text: `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} min to go`, isLive: false }
  return { days: 0, hours: 0, minutes, text: `${minutes} minute${minutes !== 1 ? 's' : ''} to go`, isLive: false }
}

function formatLaunchDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface Props {
  variant?: 'banner' | 'badge' | 'subtle'
  launchDate?: Date | string
  accent?: string
}

export function LaunchBanner({ variant = 'banner', launchDate, accent = DEFAULT_ACCENT }: Props) {
  const target = launchDate ? new Date(typeof launchDate === 'string' ? launchDate : launchDate.toISOString()) : DEFAULT_LAUNCH
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, text: '', isLive: false })

  useEffect(() => {
    setMounted(true)
    setTimeLeft(getTimeLeft(target))
    const t = setInterval(() => setTimeLeft(getTimeLeft(target)), 60 * 1000)
    return () => clearInterval(t)
  }, [target])

  // SSR fallback — neutral state
  if (!mounted) {
    return (
      <span
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
        style={{ borderColor: `${accent}80`, color: accent, background: `${accent}1a` }}
      >
        Launching {formatLaunchDate(target)}
      </span>
    )
  }

  // LIVE state — green pulse
  if (timeLeft.isLive) {
    if (variant === 'badge') {
      return (
        <div className="absolute top-4 right-4 z-10">
          <span className="relative inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold border border-[#10F5B0]/60 text-[#10F5B0] bg-[#10F5B0]/12">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10F5B0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10F5B0]" />
            </span>
            LIVE NOW
          </span>
        </div>
      )
    }
    if (variant === 'subtle') {
      return (
        <p className="text-xs font-semibold text-[#10F5B0] flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10F5B0] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10F5B0]" />
          </span>
          Live now — download ready
        </p>
      )
    }
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#10F5B0]/50 bg-[#10F5B0]/10 text-[#10F5B0]">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10F5B0] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10F5B0]" />
        </span>
        <span className="text-sm font-bold tracking-wide">LIVE NOW · Download ready</span>
      </div>
    )
  }

  // Pre-launch countdown
  if (variant === 'badge') {
    return (
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium border"
          style={{ borderColor: `${accent}80`, color: accent, background: `${accent}1a` }}
        >
          Launching {formatLaunchDate(target)}
        </span>
        <span className="text-[10px] font-medium tabular-nums" style={{ color: accent, opacity: 0.85 }}>
          {timeLeft.text}
        </span>
      </div>
    )
  }

  if (variant === 'subtle') {
    return (
      <p className="text-xs tabular-nums flex items-center gap-1.5 flex-wrap" style={{ color: '#4A6080' }}>
        Launching {formatLaunchDate(target)} · <span style={{ color: accent }}>{timeLeft.text}</span>
      </p>
    )
  }

  return (
    <div
      className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-xl border"
      style={{ borderColor: `${accent}66`, background: `${accent}1a`, color: accent }}
    >
      <span className="text-sm font-semibold">Launching {formatLaunchDate(target)}</span>
      <span className="text-xs font-medium tabular-nums opacity-90">{timeLeft.text}</span>
    </div>
  )
}
