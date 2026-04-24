'use client'
import { useState } from 'react'
import Image from 'next/image'
import DonateModal from './DonateModal'

interface Props {
  accent?: string
  appName?: string
  iconSrc?: string
  repoSlug?: string
}

export default function FundingSection({
  accent = '#4DA6FF',
  appName,
  iconSrc,
  repoSlug,
}: Props) {
  const [donateOpen, setDonateOpen] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const accentDim    = `${accent}15`
  const accentBorder = `${accent}25`
  const repoUrl = repoSlug
    ? `https://github.com/slothlabsorg/${repoSlug}`
    : 'https://github.com/slothlabsorg'

  const headline = appName
    ? `${appName} is free. The install warning is Apple's toll, not ours.`
    : `Every app here is free. The install warning is Apple's toll, not ours.`

  const subtext = appName
    ? `${appName} is open source — every line is on GitHub. Zero tracking. Zero telemetry. The install warning? That's Apple charging $99 for a certificate. Not us.`
    : `All SlothLabs apps are open source — every line is on GitHub. Zero tracking. Zero telemetry. The install warning? That's Apple charging $99 for a certificate. Not us.`

  const ctaLine = appName
    ? `${appName} runs on spare time.`
    : `These tools run on spare time.`

  const content = (
    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20 pt-4 lg:pt-0">

      {/* ── Image ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex justify-center">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: accent }}
          />
          {/* Speech bubble text overlay — positioned inside the empty bubble */}
          <div className="absolute z-20 top-[4%] right-[0%] w-[44%] flex items-center justify-center text-center pointer-events-none">
            <p
              className="text-[8px] sm:text-[9px] font-extrabold leading-tight text-gray-700 px-1"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Help us<br />please! ☕
            </p>
          </div>
          <Image
            src="/images/slothypenguin.png"
            alt="Slothy and the Linux penguin — open source forever"
            width={240}
            height={240}
            className="relative z-10 drop-shadow-2xl select-none"
          />
          <span
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{ background: accentDim, borderColor: accentBorder, color: accent }}
          >
            100% open source
          </span>
        </div>
      </div>

      {/* ── Copy ─────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4 text-center lg:text-left max-w-xl">
        <h2
          className="text-2xl md:text-3xl font-bold text-white leading-tight"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {headline}
        </h2>

        <p className="text-[#8BA3C7] leading-relaxed">{subtext}</p>

        <p className="text-[#4A6080] text-sm italic leading-relaxed">
          {ctaLine} There&apos;s no VC money. No subscription. Just a $99 Apple invoice and a hope
          that enough people find this useful. Every coffee on Ko-fi is one step closer to a clean
          install — no warning, no friction — for everyone who comes after you.
        </p>

        {/* ── How to open anyway ─────────────────────────────────── */}
        <div
          className="rounded-xl border text-left overflow-hidden"
          style={{ borderColor: accentBorder, background: accentDim }}
        >
          <button
            onClick={() => setInstallOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium gap-3"
            style={{ color: accent }}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              How to open it anyway (30 seconds)
            </span>
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="flex-shrink-0 transition-transform duration-200"
              style={{ transform: installOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {installOpen && (
            <div
              className="px-4 pb-5 pt-3 space-y-3 text-sm border-t"
              style={{ borderColor: accentBorder, color: '#8BA3C7' }}
            >
              <p className="font-semibold text-white">Right-click → Open</p>
              <ol className="space-y-1 list-decimal list-inside text-[#8BA3C7]">
                <li>Right-click the <code className="px-1 py-0.5 rounded text-xs" style={{ background: `${accent}18`, color: accent }}>.app</code> → <strong className="text-white">Open</strong></li>
                <li>Click <strong className="text-white">Open</strong> again on the warning dialog</li>
                <li>macOS remembers — you only do this once</li>
              </ol>
              <p className="text-xs text-[#4A6080]">
                Or: System Settings → Privacy &amp; Security → scroll down → Open Anyway
              </p>
            </div>
          )}
        </div>

        {/* ── CTA buttons ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start pt-1">
          <button
            onClick={() => setDonateOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 hover:brightness-110"
            style={{ background: accent, color: '#050d1f' }}
          >
            ☕ Help us get that certificate
          </button>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: accentBorder, color: accent }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Read the source
          </a>
        </div>

        {iconSrc && (
          <p className="text-xs text-[#4A6080] flex items-center gap-2 justify-center lg:justify-start">
            <Image src={iconSrc} alt="" width={14} height={14} className="opacity-60" />
            {appName} is verified open source — MIT license, zero telemetry
          </p>
        )}
        {!iconSrc && (
          <p className="text-xs text-[#4A6080]">
            All SlothLabs apps — MIT license, zero telemetry, all source on GitHub
          </p>
        )}
      </div>
    </div>
  )

  return (
    <>
      <section
        className="relative py-12 lg:py-24 overflow-hidden border-t"
        style={{ background: '#060c1a', borderColor: '#0e1f3a' }}
      >
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: accent }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
          style={{ background: accent }}
        />

        <div className="relative z-10 site-container">

          {/* Mobile: accordion trigger */}
          <button
            className="lg:hidden w-full flex items-center justify-between py-1"
            onClick={() => setMobileOpen(o => !o)}
          >
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>
              A note from Slothy
            </p>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="flex-shrink-0 transition-transform duration-300"
              style={{ color: accent, transform: mobileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {/* Desktop: always-visible label */}
          <p
            className="hidden lg:block text-xs font-semibold tracking-widest uppercase mb-8"
            style={{ color: accent }}
          >
            A note from Slothy
          </p>

          {/* Content — accordion on mobile, always shown on desktop */}
          <div className={mobileOpen ? 'block' : 'hidden lg:block'}>
            {content}
          </div>

        </div>
      </section>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  )
}
