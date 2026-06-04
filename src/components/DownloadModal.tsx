'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import type { AppMeta } from '@/data/apps'
import {
  useLatestRelease, useDetectedPlatform, pickPrimaryAsset, assetList,
} from '@/lib/useLatestRelease'

// ── Funding options ───────────────────────────────────────────────────────────
const FUNDING: Array<{
  name: string
  icon: string
  desc: string
  href: string
  color: string
  badge: string
  comingSoon?: boolean
}> = [
  {
    name: 'Ko-fi',
    icon: '☕',
    desc: 'One-time or recurring. Recurring? Get exclusive Slothy the Sloth dev swag at 3rd, 6th & 12th month.',
    href: 'https://ko-fi.com/slothlabs',
    color: '#FF5E5B',
    badge: '0% fees',
  },
  {
    name: 'GitHub Sponsors',
    icon: '💜',
    desc: 'One-time or recurring — GitHub matches. Recurring? Get exclusive Slothy swag at 3rd, 6th & 12th month.',
    href: 'https://github.com/sponsors/slothlabsorg',
    color: '#8957e5',
    badge: '0% from GitHub',
  },
  {
    name: 'Polar.sh',
    icon: '⭐',
    desc: 'Fund features you want built',
    href: 'https://polar.sh/slothlabs',
    color: '#00D4FF',
    badge: 'OSS focused',
    comingSoon: true,
  },
]

const LAUNCHING_SOON_TOOLTIP = "Launching soon — we're polishing details. Join the waitlist for early access."

function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

interface Props {
  /** The app to download — drives repo lookup, icon, accent, copy. */
  app: AppMeta
  /** The label shown on the triggering button. */
  buttonLabel?: string
  /** Additional classes on the trigger button. */
  className?: string
  /** Inline styles on the trigger button (pages that use hex accents). */
  style?: React.CSSProperties
  /** When true, disable the trigger and show a "coming soon" tooltip. */
  launchingSoon?: boolean
  /** Where the "join the waitlist" CTA points when no release exists yet. */
  subscribeUrl?: string
}

export default function DownloadModal({ app, buttonLabel, className = '', style, launchingSoon = false, subscribeUrl }: Props) {
  const [open, setOpen]            = useState(false)
  const [step, setStep]            = useState<'donate' | 'download'>('donate')
  const [showAll, setShowAll]      = useState(false)
  const [copied, setCopied]        = useState(false)

  const { loading, data }          = useLatestRelease(app.slug)
  const { os, arch }               = useDetectedPlatform()
  const primary                    = data?.available ? pickPrimaryAsset(data.assets, os, arch) : null
  const allAssets                  = data?.available ? assetList(data.assets) : []

  const close = useCallback(() => {
    setOpen(false)
    setTimeout(() => { setStep('donate'); setShowAll(false) }, 300)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Disable the trigger when the page says so OR once we know GitHub has no
  // published release yet — so pre-launch apps auto-show "Coming soon" and flip
  // to an active download the moment a release is published (no manual edits).
  const noRelease = data !== null && !data.available
  const disabled = launchingSoon || noRelease
  const triggerLabel = buttonLabel ?? `Download ${app.name}`
  const pkgCmds: Array<{ label: string; code: string }> = [
    app.brewCmd   && { label: 'Homebrew', code: app.brewCmd },
    app.wingetCmd && { label: 'winget',   code: app.wingetCmd },
    app.aptCmd    && { label: 'apt / Arch', code: app.aptCmd },
  ].filter(Boolean) as Array<{ label: string; code: string }>

  return (
    <>
      {/* Trigger button */}
      {disabled ? (
        <span className="relative inline-flex">
          <button
            type="button"
            disabled
            title={LAUNCHING_SOON_TOOLTIP}
            className={`${className} opacity-70 cursor-not-allowed hover:brightness-100 hover:translate-y-0`}
            style={style}
          >
            {triggerLabel}
          </button>
          <span className="md:hidden absolute -top-0.5 -right-0.5 text-[10px] leading-tight px-1.5 py-0.5 rounded-md border border-[#4DA6FF]/50 text-[#4DA6FF] bg-[#050d1f] font-medium whitespace-nowrap">
            Coming soon
          </span>
        </span>
      ) : (
        <button onClick={() => { setOpen(true); setStep('donate') }} className={className} style={style}>
          {triggerLabel}
        </button>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={close}>
          <div className="absolute inset-0 bg-[#050d1f]/90 backdrop-blur-md" />

          <div
            className="relative z-10 w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-2xl bg-[#0d1b3e] border border-[#1a3060] overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: `0 0 80px ${app.accent}1f, 0 32px 64px rgba(0,0,0,0.6)` }}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#112244] flex items-center justify-center text-[#4A6080] hover:text-white hover:bg-[#1a3060] transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="overflow-y-auto min-h-0 flex-1">
            {step === 'donate' ? (
              // ── Step 1: Donation ask ────────────────────────────────────────
              <div>
                <div className="relative h-44 bg-gradient-to-b from-[#071020] to-[#0d1b3e] overflow-hidden flex items-center justify-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-44 rounded-full blur-3xl" style={{ background: `${app.accent}14` }} />
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={120}
                    height={120}
                    className="relative z-10 h-28 w-auto object-contain"
                    style={{ filter: `drop-shadow(0 0 20px ${app.accent}4d)` }}
                  />
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0d1b3e] to-transparent" />
                </div>

                <div className="px-7 py-6">
                  <h2 className="text-2xl font-black text-white mb-2 leading-tight" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
                    {app.name} is <span className="shimmer-text">free forever</span>
                  </h2>
                  <p className="text-sm text-[#8BA3C7] leading-relaxed mb-6">
                    We build dev tools on nights and weekends. A small contribution keeps
                    the servers on, the sloth caffeinated, and new features coming.
                    Totally optional — no pressure.
                  </p>

                  <div className="space-y-3 mb-6">
                    {FUNDING.map(f => (
                      f.comingSoon ? (
                        <div key={f.name} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#071020] border border-[#1a3060] opacity-70 cursor-not-allowed">
                          <span className="text-2xl w-8 text-center flex-shrink-0">{f.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#8BA3C7]">{f.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full border border-[#4A6080]/50 text-[#4A6080] bg-[#112244]">Coming soon</span>
                            </div>
                            <div className="text-xs text-[#4A6080] mt-0.5">{f.desc}</div>
                          </div>
                        </div>
                      ) : (
                        <a key={f.name} href={f.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3.5 rounded-xl bg-[#071020] border border-[#1a3060] hover:border-[#00D4FF]/40 transition-all group hover:-translate-y-0.5">
                          <span className="text-2xl w-8 text-center flex-shrink-0 group-hover:scale-110 transition-transform">{f.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{f.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: f.color, borderColor: `${f.color}40`, backgroundColor: `${f.color}15` }}>{f.badge}</span>
                            </div>
                            <div className="text-xs text-[#4A6080] mt-0.5">{f.desc}</div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#4A6080] group-hover:text-[#00D4FF] flex-shrink-0 transition-colors">
                            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => setStep('download')}
                    className="w-full py-3.5 rounded-xl text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-3"
                    style={{ background: '#F5A623', boxShadow: '0 0 20px rgba(245,166,35,0.35)' }}
                  >
                    <span className="w-8 h-8 flex-shrink-0 rounded-lg bg-no-repeat bg-center bg-contain opacity-95" style={{ backgroundImage: `url(${app.icon})` }} role="img" aria-hidden />
                    Continue to download
                  </button>
                </div>
              </div>
            ) : (
              // ── Step 2: Download ─────────────────────────────────────────────
              <div className="px-7 py-8 pb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-no-repeat bg-center bg-contain flex-shrink-0" style={{ backgroundImage: `url(${app.icon})` }} role="img" aria-hidden />
                  <div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Download {app.name}</h2>
                    <p className="text-xs text-[#4A6080]">
                      {loading ? 'Checking latest release…'
                        : !data?.available ? 'Not published yet'
                        : os === 'unknown' ? 'Choose your platform'
                        : `Detected: ${os}${arch !== 'unknown' ? ` · ${arch === 'arm64' ? 'Apple Silicon/ARM' : 'x64'}` : ''}`}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-sm text-[#4A6080]">Loading latest release…</div>
                ) : !data?.available ? (
                  // No release yet → waitlist + repo link
                  <div className="rounded-xl bg-[#071020] border border-[#1a3060] p-6 text-center space-y-4">
                    <p className="text-sm text-[#8BA3C7]">{app.name} hasn’t shipped its first public release yet.</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      {subscribeUrl && (
                        <a href={subscribeUrl} className="px-4 py-2 rounded-full text-xs font-bold" style={{ background: app.accent, color: '#050d1f' }}>Join the waitlist</a>
                      )}
                      <a href={`https://github.com/slothlabsorg/${app.repo}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-xs font-semibold border" style={{ borderColor: `${app.accent}50`, color: app.accent }}>Watch the repo →</a>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Primary direct download (detected OS/arch) */}
                    {primary ? (
                      <a
                        href={primary.asset.url}
                        className="flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all group mb-3 hover:-translate-y-0.5"
                        style={{ background: `${app.accent}1a`, borderColor: `${app.accent}66` }}
                      >
                        <div className="text-left flex items-center gap-3">
                          <span className="text-xl">{primary.icon}</span>
                          <div>
                            <div className="font-semibold text-white text-sm">{primary.label}</div>
                            <div className="text-xs text-[#4A6080]">{(primary.asset.size / 1048576).toFixed(1)} MB · v{data.version}</div>
                          </div>
                        </div>
                        <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ background: app.accent, color: '#050d1f' }}>Download</span>
                      </a>
                    ) : (
                      <p className="text-sm text-[#8BA3C7] mb-3">Pick your platform below.</p>
                    )}

                    {/* Package managers (only if configured for this app) */}
                    {pkgCmds.map(pm => (
                      <div key={pm.label} className="rounded-xl bg-[#071020] border border-[#1a3060] overflow-hidden mb-3">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a3060]">
                          <span className="text-xs font-medium text-[#8BA3C7]">{pm.label}</span>
                          <button
                            type="button"
                            onClick={() => { void navigator.clipboard.writeText(pm.code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                            className="text-xs px-2 py-1 rounded-md bg-[#112244] text-[#00D4FF] hover:bg-[#00D4FF]/15 transition-colors"
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-4 text-xs text-[#8BA3C7] font-mono whitespace-pre-wrap overflow-x-auto">{pm.code}</pre>
                      </div>
                    ))}

                    {/* All platforms / architectures */}
                    {allAssets.length > 1 && (
                      <>
                        <button onClick={() => setShowAll(!showAll)} className="text-xs text-[#4A6080] hover:text-[#8BA3C7] transition-colors mb-3 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${showAll ? 'rotate-180' : ''}`}>
                            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          All platforms & architectures
                        </button>
                        {showAll && (
                          <div className="space-y-2 mb-4">
                            {allAssets.map(a => (
                              <a
                                key={a.key}
                                href={a.asset.url}
                                className="flex items-center justify-between p-3 rounded-lg bg-[#071020] border border-[#1a3060] hover:border-[#00D4FF]/40 transition-all text-sm"
                              >
                                <span className="flex items-center gap-2 text-[#8BA3C7]"><span>{a.icon}</span>{a.label}</span>
                                <span className="text-xs text-[#4A6080]">{(a.asset.size / 1048576).toFixed(1)} MB</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <p className="text-xs text-[#4A6080] text-center mt-2">
                      v{data.version}{data.date ? ` · ${fmtDate(data.date)}` : ''} ·{' '}
                      <a href={data.releasesUrl} target="_blank" rel="noopener noreferrer" className="text-[#00D4FF]/70 hover:text-[#00D4FF] transition-colors">
                        All releases
                      </a>
                      {app.docsUrl && (
                        <>
                          {' · '}
                          <a href={app.docsUrl} className="text-[#00D4FF]/70 hover:text-[#00D4FF] transition-colors">Changelog</a>
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
            )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
