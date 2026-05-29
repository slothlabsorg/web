'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { UpcomingLaunch } from '@/data/upcomingLaunches'
import { launchTsUtcNoon } from '@/data/upcomingLaunches'
import SharePermalink from './SharePermalink'

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  isLive: boolean
}

function getCountdown(target: number, now: number): Countdown {
  const diff = target - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true }
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { days, hours, minutes, seconds, isLive: false }
}

interface Props {
  launch: UpcomingLaunch
  /** Permalink URL for this launch — passed in so the same component is reused on /next/[slug]. */
  permalink: string
  /** Visual variant — `home` is wider/with chrome; `permalink` is centered/minimal. */
  variant?: 'home' | 'permalink'
}

export default function NextBigReleaseHero({ launch, permalink, variant = 'home' }: Props) {
  const targetTs = launchTsUtcNoon(launch.launchDate)
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState<Countdown | null>(null)

  useEffect(() => {
    setMounted(true)
    if (targetTs === null) return
    setCountdown(getCountdown(targetTs, Date.now()))
    const t = setInterval(() => setCountdown(getCountdown(targetTs, Date.now())), 1000)
    return () => clearInterval(t)
  }, [targetTs])

  const accent = launch.accent
  const accentDim = `${accent}1a`
  const accentMid = `${accent}40`
  const isLive = countdown?.isLive === true
  const isTBD = targetTs === null

  return (
    <section
      className={variant === 'home' ? 'relative py-20 overflow-hidden' : 'relative py-24 overflow-hidden'}
      style={{
        background: `radial-gradient(circle at 30% 0%, ${accentDim} 0%, transparent 55%), linear-gradient(180deg, #050d1f 0%, #060d22 100%)`,
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -right-32 rounded-full opacity-30 blur-[120px]"
          style={{ width: 520, height: 520, background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 site-container">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          {/* Left: copy + countdown */}
          <div className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] border"
              style={{ color: accent, background: accentDim, borderColor: accentMid }}
            >
              <span className="text-base leading-none">{launch.icon}</span>
              Next big release · {launch.appName}
            </div>

            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {launch.headline}
            </h2>

            <p className="text-[#8BA3C7] text-base lg:text-lg max-w-xl leading-relaxed">
              {launch.pitch}
            </p>

            {/* Countdown */}
            <div className="pt-2">
              {!mounted ? (
                <div
                  className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                  style={{ borderColor: accentMid, background: accentDim, color: accent }}
                >
                  <span className="text-sm font-semibold">{isTBD ? 'Launching later in 2026' : `Launching ${launch.dateLabel}`}</span>
                </div>
              ) : isTBD ? (
                <div
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border"
                  style={{ borderColor: accentMid, background: accentDim, color: accent }}
                >
                  <span className="text-sm font-bold tracking-wide uppercase">Date TBD · Later in 2026</span>
                </div>
              ) : isLive ? (
                <div
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-[#10F5B0]/50 bg-[#10F5B0]/10 text-[#10F5B0]"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10F5B0] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10F5B0]" />
                  </span>
                  <span className="text-sm font-bold tracking-wide">LIVE NOW · Download ready</span>
                </div>
              ) : countdown ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 max-w-md">
                    {[
                      { label: 'days', value: countdown.days },
                      { label: 'hours', value: countdown.hours },
                      { label: 'mins', value: countdown.minutes },
                      { label: 'secs', value: countdown.seconds },
                    ].map(c => (
                      <div
                        key={c.label}
                        className="rounded-xl border px-3 py-3 text-center"
                        style={{ borderColor: accentMid, background: accentDim }}
                      >
                        <div className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: accent, fontFamily: 'Syne, sans-serif' }}>
                          {c.value.toString().padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#4A6080] mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#4A6080]">
                    Launching {launch.dateLabel}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={launch.subscribeUrl}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: accent, color: '#050d1f' }}
              >
                {isTBD ? `Get notified when ${launch.appName} ships` : `Subscribe — ${launch.appName} drops ${launch.dateLabel}`}
              </Link>
              <Link
                href={launch.productUrl}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium border transition-colors hover:text-white"
                style={{ borderColor: accentMid, color: accent }}
              >
                Learn more →
              </Link>
            </div>

            <SharePermalink permalink={permalink} appName={launch.appName} dateLabel={launch.dateLabel} accent={accent} />
          </div>

          {/* Right: preview */}
          <div className="lg:col-span-2">
            <div
              className="relative rounded-3xl overflow-hidden border shadow-2xl"
              style={{ borderColor: accentMid, background: '#0a1424' }}
            >
              <Image
                src={launch.previewImage}
                alt={`${launch.appName} preview`}
                width={1200}
                height={800}
                className="w-full h-auto"
                priority={variant === 'permalink'}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
