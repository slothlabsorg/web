'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

// ── OS detection ─────────────────────────────────────────────────────────────
type OS = 'macOS' | 'Windows' | 'Linux' | 'unknown'

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua  = navigator.userAgent
  const platform = (navigator as Navigator & { userAgentData?: { platform: string } })
    .userAgentData?.platform ?? navigator.platform ?? ''

  if (/Mac/i.test(platform) || /Mac/i.test(ua)) return 'macOS'
  if (/Win/i.test(platform) || /Win/i.test(ua)) return 'Windows'
  if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'Linux'
  return 'unknown'
}

const OS_DOWNLOADS: Record<OS, { label: string; note: string; icon: string }> = {
  macOS:   { label: 'Download for macOS',   note: '.dmg · Universal (Apple Silicon + Intel)', icon: '🍎' },
  Windows: { label: 'Download for Windows', note: '.exe installer · Windows 10+',             icon: '🪟' },
  Linux:   { label: 'Download for Linux',   note: '.AppImage · Debian/Ubuntu/Arch',           icon: '🐧' },
  unknown: { label: 'Download CloudOrbit',  note: 'Choose your platform below',               icon: '⬇️' },
}

const OTHER_PLATFORMS: Array<{ os: OS; icon: string; label: string }> = [
  { os: 'macOS',   icon: '🍎', label: 'macOS' },
  { os: 'Windows', icon: '🪟', label: 'Windows' },
  { os: 'Linux',   icon: '🐧', label: 'Linux' },
]

// ── Download methods per OS (direct link pending) ─────────────────────────────
const DOWNLOAD_METHODS: Record<OS, { direct: { label: string; note: string }; packageManager: { label: string; code: string } }> = {
  macOS: {
    direct:   { label: '.dmg installer', note: 'Universal (Apple Silicon + Intel)' },
    packageManager: { label: 'Homebrew', code: 'brew tap slothlabs/cloudorbit\nbrew install cloudorbit' },
  },
  Windows: {
    direct:   { label: '.exe installer', note: 'Windows 10+' },
    packageManager: { label: 'winget', code: 'winget install SlothLabs.CloudOrbit' },
  },
  Linux: {
    direct:   { label: '.AppImage', note: 'Portable' },
    packageManager: { label: 'apt / Arch', code: '# Debian/Ubuntu\nsudo apt install cloudorbit\n\n# Arch\nyay -S cloudorbit' },
  },
  unknown: {
    direct:   { label: 'Direct download', note: 'Pick your platform below' },
    packageManager: { label: 'Package manager', code: 'brew tap slothlabs/cloudorbit\nbrew install cloudorbit' },
  },
}

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
    href: 'https://github.com/sponsors/slothlabs',
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

// ── Modal component ───────────────────────────────────────────────────────────
const LAUNCHING_SOON_TOOLTIP = "Launching in a week — we're polishing details. Join the waitlist for early access."

interface Props {
  /** The label shown on the triggering button */
  buttonLabel?: string
  /** Additional classes on the trigger button */
  className?: string
  /** When true, disable download and show tooltip; user can join waitlist instead */
  launchingSoon?: boolean
}

export default function DownloadModal({ buttonLabel, className = '', launchingSoon = false }: Props) {
  const [open, setOpen]           = useState(false)
  const [step, setStep]           = useState<'donate' | 'download'>('donate')
  const [os, setOs]               = useState<OS>('unknown')
  const [showAllPlatforms, setAll] = useState(false)
  const [copied, setCopied]       = useState(false)

  // Detect OS once on client
  useEffect(() => {
    setOs(detectOS())
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    // Reset to donate step after animation
    setTimeout(() => setStep('donate'), 300)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const dl = OS_DOWNLOADS[os]
  const triggerLabel = buttonLabel ?? dl.label

  return (
    <>
      {/* Trigger button */}
      {launchingSoon ? (
        <button
          type="button"
          disabled
          title={LAUNCHING_SOON_TOOLTIP}
          className={`${className} opacity-70 cursor-not-allowed hover:brightness-100 hover:translate-y-0`}
        >
          {triggerLabel}
        </button>
      ) : (
        <button
          onClick={() => { setOpen(true); setStep('donate') }}
          className={className}
        >
          {triggerLabel}
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#050d1f]/90 backdrop-blur-md" />

          {/* Modal card */}
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0d1b3e] border border-[#1a3060] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 0 80px rgba(0,212,255,0.12), 0 32px 64px rgba(0,0,0,0.6)' }}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#112244] flex items-center justify-center text-[#4A6080] hover:text-white hover:bg-[#1a3060] transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {step === 'donate' ? (
              // ── Step 1: Donation ask ────────────────────────────────────────
              <div>
                {/* Sloth image header */}
                <div className="relative h-48 bg-gradient-to-b from-[#071020] to-[#0d1b3e] overflow-hidden flex items-end justify-center">
                  {/* Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full bg-[#00D4FF]/8 blur-3xl" />
                  {/* Placeholder — replace with sloth-coffee.png when ready */}
                  <Image
                    src="/images/cloudorbit-badge.png"
                    alt="CloudOrbit sloth"
                    width={240}
                    height={180}
                    className="relative z-10 h-44 w-auto object-contain object-bottom"
                    style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.3))' }}
                  />
                  {/* Gradient fade bottom */}
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0d1b3e] to-transparent" />
                </div>

                <div className="px-7 py-6">
                  <h2
                    className="text-2xl font-black text-white mb-2 leading-tight"
                    style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
                  >
                    CloudOrbit is{' '}
                    <span className="shimmer-text">free forever</span>
                  </h2>
                  <p className="text-sm text-[#8BA3C7] leading-relaxed mb-6">
                    We build dev tools on nights and weekends. A small contribution keeps
                    the servers on, the sloth caffeinated, and new features coming.
                    Totally optional — no pressure.
                  </p>

                  {/* Funding options */}
                  <div className="space-y-3 mb-6">
                    {FUNDING.map(f => (
                      f.comingSoon ? (
                        <div
                          key={f.name}
                          className="flex items-center gap-4 p-3.5 rounded-xl bg-[#071020] border border-[#1a3060] opacity-70 cursor-not-allowed"
                        >
                          <span className="text-2xl w-8 text-center flex-shrink-0">{f.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#8BA3C7]">{f.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full border border-[#4A6080]/50 text-[#4A6080] bg-[#112244]">
                                Coming soon
                              </span>
                            </div>
                            <div className="text-xs text-[#4A6080] mt-0.5">{f.desc}</div>
                          </div>
                        </div>
                      ) : (
                        <a
                          key={f.name}
                          href={f.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-3.5 rounded-xl bg-[#071020] border border-[#1a3060] hover:border-[#00D4FF]/40 transition-all group hover:-translate-y-0.5"
                        >
                          <span className="text-2xl w-8 text-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            {f.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{f.name}</span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full border"
                                style={{
                                  color: f.color,
                                  borderColor: `${f.color}40`,
                                  backgroundColor: `${f.color}15`,
                                }}
                              >
                                {f.badge}
                              </span>
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

                  {/* CTA row — app icon for recall */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setStep('download')}
                      className="w-full py-3.5 rounded-xl bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-3"
                      style={{ boxShadow: '0 0 20px rgba(245,166,35,0.35)' }}
                    >
                      <span
                        className="w-8 h-8 flex-shrink-0 rounded-lg bg-no-repeat bg-center bg-contain opacity-95"
                        style={{ backgroundImage: 'url(/images/cloudorbit-icon.png)' }}
                        role="img"
                        aria-hidden
                      />
                      {dl.label}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // ── Step 2: Two options — direct download + package manager ───────
              <div className="px-7 py-8">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-xl bg-no-repeat bg-center bg-contain flex-shrink-0"
                    style={{ backgroundImage: 'url(/images/cloudorbit-icon.png)' }}
                    role="img"
                    aria-hidden
                  />
                  <div>
                    <h2
                      className="text-xl font-bold text-white"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Download CloudOrbit
                    </h2>
                    <p className="text-xs text-[#4A6080]">
                      {os === 'unknown' ? 'Choose your platform' : `Detected: ${os}`}
                    </p>
                  </div>
                </div>

                {/* Option 1: Direct download (.dmg / .exe / .AppImage) — link pending */}
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-[#00D4FF]/10 border-2 border-[#00D4FF]/40 hover:border-[#00D4FF]/60 transition-all group mb-3 pointer-events-none opacity-90"
                  aria-disabled
                >
                  <div className="text-left flex items-center gap-3">
                    <span className="text-xl">{dl.icon}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{DOWNLOAD_METHODS[os].direct.label}</div>
                      <div className="text-xs text-[#4A6080]">{DOWNLOAD_METHODS[os].direct.note}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#4A6080]/30 text-[#8BA3C7] border border-[#1a3060]">
                    Link coming soon
                  </span>
                </a>

                {/* Option 2: Package manager (brew / winget / apt) — copy code */}
                <div className="rounded-xl bg-[#071020] border border-[#1a3060] overflow-hidden mb-4">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a3060]">
                    <span className="text-xs font-medium text-[#8BA3C7]">{DOWNLOAD_METHODS[os].packageManager.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = DOWNLOAD_METHODS[os].packageManager.code
                        void navigator.clipboard.writeText(code)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="text-xs px-2 py-1 rounded-md bg-[#112244] text-[#00D4FF] hover:bg-[#00D4FF]/15 transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 text-xs text-[#8BA3C7] font-mono whitespace-pre-wrap overflow-x-auto">
                    {DOWNLOAD_METHODS[os].packageManager.code}
                  </pre>
                </div>

                {/* Other platforms */}
                <button
                  onClick={() => setAll(!showAllPlatforms)}
                  className="text-xs text-[#4A6080] hover:text-[#8BA3C7] transition-colors mb-3 flex items-center gap-1"
                >
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    className={`transition-transform ${showAllPlatforms ? 'rotate-180' : ''}`}
                  >
                    <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Other platforms
                </button>

                {showAllPlatforms && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {OTHER_PLATFORMS.filter(p => p.os !== os).map(p => (
                      <button
                        key={p.os}
                        onClick={() => setOs(p.os)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#071020] border border-[#1a3060] hover:border-[#00D4FF]/40 transition-all text-xs text-[#8BA3C7] hover:text-white"
                      >
                        <span className="text-xl">{p.icon}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-[#4A6080] text-center">
                  Version 0.1.0-beta ·{' '}
                  <a href="/cloudorbit/docs" className="text-[#00D4FF]/70 hover:text-[#00D4FF] transition-colors">
                    View changelog
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
