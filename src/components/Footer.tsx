'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { slothLabsContent } from '@/config/content'
import ContactModal from './ContactModal'
import DonateModal from './DonateModal'

interface Props {
  accent?: string
  showSuiteLink?: boolean
}

function DownloadCounter() {
  const [count, setCount] = useState(0)
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Pick a random seed between 5000 and 10000 once on mount
    const seed = Math.floor(Math.random() * 5001) + 5000
    setCount(seed)

    const tick = () => {
      setCount(c => c + Math.floor(Math.random() * 4) + 1)
      // Next tick in 1.5s–5s
      ref.current = setTimeout(tick, Math.floor(Math.random() * 3500) + 1500)
    }
    ref.current = setTimeout(tick, Math.floor(Math.random() * 3500) + 1500)
    return () => { if (ref.current) clearTimeout(ref.current) }
  }, [])

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-5 rounded-full border border-[#1a3060] bg-[#060d1f] text-xs">
      <span className="w-2 h-2 rounded-full bg-[#4DA6FF] animate-pulse flex-shrink-0" />
      <span className="text-[#4A6080]">Orbit Tools Downloads</span>
      <span className="font-bold text-white tabular-nums">{count.toLocaleString()}</span>
    </div>
  )
}

export default function Footer({ accent = '#4DA6FF', showSuiteLink = false }: Props) {
  const { footer } = slothLabsContent
  const [contactOpen, setContactOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)
  const [toast, setToast] = useState(false)

  const showComingSoon = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <footer className="bg-[#0d1b3e] border-t border-[#1a3060]">
      <div className="site-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div
              className="h-12 w-[203px] bg-no-repeat bg-[length:100%]"
              style={{
                backgroundImage: 'url(/images/slothlabs-logo-light.png)',
                backgroundSize: '100%',
                backgroundPosition: 'left center',
              }}
              role="img"
              aria-label="SlothLabs"
            />
            <p className="text-[#4A6080] text-sm leading-relaxed mt-[2px]">
              {(() => {
                const parts = footer.tagline.split('time back')
                if (parts.length !== 2) return footer.tagline
                return (
                  <>
                    {parts[0]}
                    <span className="shimmer-text font-semibold">time back</span>
                    {parts[1]}
                  </>
                )
              })()}
            </p>
            {showSuiteLink && (
              <Link href="/" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1" style={{ color: accent }}>
                Part of the SlothLabs suite →
              </Link>
            )}
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-semibold text-[#4A6080] uppercase tracking-widest mb-4">Products</h4>
            <ul className="space-y-2">
              {footer.products.map((p: { label: string; href: string } | string) => {
                const label = typeof p === 'string' ? p : p.label
                const href  = typeof p === 'string' ? '#' : p.href
                return (
                  <li key={label}>
                    <Link href={href} className="text-sm text-[#8BA3C7] hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Organization */}
          <div>
            <h4 className="text-xs font-semibold text-[#4A6080] uppercase tracking-widest mb-4">Organization</h4>
            <ul className="space-y-2">
              {footer.organization.map(({ label, href }) => (
                <li key={label}>
                  {label === 'Contact' ? (
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      className="text-sm text-[#8BA3C7] hover:text-white transition-colors"
                    >
                      {label}
                    </button>
                  ) : (
                    <Link href={href} className="text-sm text-[#8BA3C7] hover:text-white transition-colors">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold text-[#4A6080] uppercase tracking-widest mb-4">Connect</h4>
            <ul className="space-y-2">
              {footer.social.map(s => (
                <li key={s.label}>
                  {'comingSoon' in s && s.comingSoon ? (
                    <button
                      type="button"
                      onClick={showComingSoon}
                      className="text-sm text-[#8BA3C7] hover:text-white transition-colors"
                    >
                      {s.label}
                    </button>
                  ) : (
                    <a
                      href={s.href}
                      target={s.external ? '_blank' : undefined}
                      rel={s.external ? 'noopener noreferrer' : undefined}
                      className="text-sm text-[#8BA3C7] hover:text-white transition-colors"
                    >
                      {s.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a3060] pt-6 text-center space-y-3">
          <div className="flex justify-center mb-1">
            <DownloadCounter />
          </div>
          <p className="text-xs text-[#4A6080]">{footer.copy}</p>
          {footer.trademark && (
            <p className="text-xs text-[#4A6080]/80 max-w-xl mx-auto">{footer.trademark}</p>
          )}
          {footer.donateLink && (
            <p className="text-xs">
              <button
                type="button"
                onClick={() => setDonateOpen(true)}
                className="text-[#00D4FF]/90 hover:text-[#00D4FF] transition-colors underline underline-offset-2"
              >
                {footer.donateLink}
              </button>
            </p>
          )}
        </div>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />

      {/* Toast: Coming soon */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-xl bg-[#0d1b3e] border border-[#1a3060] text-sm text-[#8BA3C7] shadow-lg"
          role="status"
        >
          Coming soon
        </div>
      )}
    </footer>
  )
}
