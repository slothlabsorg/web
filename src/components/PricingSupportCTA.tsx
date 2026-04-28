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
          <div className="flex flex-col items-center gap-6">
            <div className="overflow-hidden rounded-2xl w-full max-w-[600px]">
              <iframe
                src="https://github.com/sponsors/slothlabsorg/card"
                title="Sponsor slothlabsorg"
                height="225"
                style={{ border: 0, width: '100%', minWidth: 0, display: 'block' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setDonateOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#4DA6FF] text-[#050d1f] font-semibold text-sm hover:brightness-110 transition-all"
            >
              Other ways to support
            </button>
          </div>
        </div>
      </section>
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  )
}
