'use client'
import { useEffect, useCallback } from 'react'
import Image from 'next/image'

const FUNDING = [
  {
    name: 'Ko-fi',
    icon: '☕',
    desc: 'One-time donation — no account needed',
    href: 'https://ko-fi.com/slothlabs',
    color: '#FF5E5B',
    badge: '0% fees',
  },
  {
    name: 'GitHub Sponsors',
    icon: '💜',
    desc: 'Monthly support — matched by GitHub',
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
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function DonateModal({ open, onClose }: Props) {
  const close = useCallback(() => onClose(), [onClose])

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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      onClick={close}
    >
      {/* Strong blur so only the modal is clear */}
      <div className="absolute inset-0 bg-[#050d1f]/95 backdrop-blur-xl" />

      <div
        className="relative z-10 w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-2xl bg-[#0d1b3e] border border-[#1a3060] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 0 80px rgba(0,212,255,0.12), 0 32px 64px rgba(0,0,0,0.6)' }}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#112244] flex items-center justify-center text-[#4A6080] hover:text-white hover:bg-[#1a3060] transition-all"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Sloth mascot image */}
        <div className="relative h-52 bg-gradient-to-b from-[#071020] to-[#0d1b3e] overflow-hidden flex items-end justify-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-52 rounded-full bg-[#00D4FF]/10 blur-3xl" />
          <Image
            src="/images/sloth-donate-banner.png"
            alt="SlothLabs mascot"
            width={280}
            height={280}
            className="relative z-10 h-48 w-auto object-contain object-bottom"
            style={{ filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.25))' }}
          />
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#0d1b3e] to-transparent" />
        </div>

        <div className="px-7 py-6 overflow-y-auto min-h-0 flex-1">
          <h2
            className="text-2xl font-black text-white mb-2 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            Support SlothLabs
          </h2>
          <p className="text-sm text-[#8BA3C7] leading-relaxed mb-6">
            We build dev tools on nights and weekends. A small contribution keeps
            the servers on, the sloth caffeinated, and new features coming.
            Totally optional — no pressure.
          </p>

          <div className="flex justify-center mb-5 overflow-hidden rounded-xl">
            <iframe
              src="https://github.com/sponsors/slothlabsorg/card"
              title="Sponsor slothlabsorg"
              height="225"
              style={{ border: 0, width: '100%', minWidth: 0 }}
            />
          </div>

          <div className="space-y-3">
            {FUNDING.map(f => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
