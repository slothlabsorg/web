'use client'

import { useState } from 'react'
import DonateModal from './DonateModal'

export default function PricingSupportCTA() {
  const [donateOpen, setDonateOpen] = useState(false)
  return (
    <>
      <section className="py-16 md:py-24 border-t border-[#1a3060]">
        <div className="site-container text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-4"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            Support our work
          </h2>
          <p className="text-[#8BA3C7] mb-8 max-w-xl mx-auto">
            We build in our free time with no formal backing. If our tools help you, consider supporting us so we can keep improving them for everyone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setDonateOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#4DA6FF] text-[#050d1f] font-semibold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
            >
              ☕ Support the project
            </button>
            <a
              href="https://github.com/slothlabsorg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#1a3060] text-sm font-medium text-[#8BA3C7] hover:text-white hover:border-[#4DA6FF]/40 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
              </svg>
              Sponsor on GitHub
            </a>
          </div>
        </div>
      </section>
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  )
}
