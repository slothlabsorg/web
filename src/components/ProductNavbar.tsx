'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  icon: string       // emoji
  name: string       // e.g. "WattsOrbit"
  accent: string     // e.g. "#F59E0B"
  ctaLabel?: string
  ctaHref?: string
}

export default function ProductNavbar({
  icon,
  name,
  accent,
  ctaLabel = 'Join waitlist',
  ctaHref = 'https://form.jotform.com/260731775592061',
}: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobile] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md bg-[#050d1f]/80 border-b border-[#1a3060]' : ''
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Icon + name + by SlothLabs */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${accent}22`, border: `1px solid ${accent}40` }}
          >
            {icon}
          </div>
          <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {name}
          </span>
          <Link href="/" className="text-xs text-[#4A6080] hover:text-[#8BA3C7] transition-colors ml-1 hidden sm:block">
            by SlothLabs
          </Link>
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-sm text-[#8BA3C7] hover:text-white transition-colors">
            ← All tools
          </Link>
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-full font-semibold hover:brightness-110 transition-all"
            style={{ background: accent, color: '#050d1f' }}
          >
            {ctaLabel}
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#8BA3C7] hover:text-white p-2"
          onClick={() => setMobile(!mobileOpen)}
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {mobileOpen
              ? <><path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
              : <><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
            }
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden drawer-open bg-[#0d1b3e]/95 backdrop-blur-md border-b border-[#1a3060] px-6 py-6 flex flex-col gap-4">
          <Link href="/" className="text-sm text-[#8BA3C7] hover:text-white py-1" onClick={() => setMobile(false)}>
            ← All SlothLabs tools
          </Link>
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full text-sm px-4 py-3 rounded-full font-semibold text-center"
            style={{ background: accent, color: '#050d1f' }}
          >
            {ctaLabel}
          </a>
        </div>
      )}
    </header>
  )
}
