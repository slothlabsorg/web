'use client'
import { useState } from 'react'
import DonateModal from './DonateModal'

export default function SupportBanner() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section className="relative overflow-hidden border-t border-[#1a3060]" style={{ background: '#060d20' }}>
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/3 w-96 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />

        <div className="relative z-10 site-container py-20">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-3xl mx-auto">

            {/* Sloth image */}
            <div className="flex-shrink-0 w-44 h-44 md:w-56 md:h-56 relative">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-30"
                style={{ background: '#4DA6FF' }} />
              <div
                className="relative w-full h-full bg-contain bg-center bg-no-repeat drop-shadow-2xl"
                style={{ backgroundImage: 'url(/images/sloth-mascot-resting.png)' }}
                role="img"
                aria-label="SlothLabs slothy mascot"
              />
            </div>

            {/* Copy */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Keep SlothLabs alive</p>
              <h2
                className="text-2xl md:text-3xl font-bold text-white leading-tight"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                These tools run on coffee<br className="hidden sm:block" /> and your support
              </h2>
              <p className="text-[#8BA3C7] leading-relaxed max-w-lg">
                Every app here is built on nights and weekends — no VC money, no ads, no tracking.
                The servers cost money. The time isn&apos;t free. A small contribution keeps the infrastructure
                running, the sloth caffeinated, and the roadmap alive. Without it, projects like this quietly
                go dark.
              </p>
              <p className="text-[#4A6080] text-sm">
                You&apos;ve already saved more time than it costs. Help keep it going.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm bg-[#F5A623] text-[#050d1f] hover:brightness-110 transition-all hover:-translate-y-0.5 flex-shrink-0"
                >
                  ☕ Support the project
                </button>
                <iframe
                  src="https://github.com/sponsors/slothlabsorg/button"
                  title="Sponsor slothlabsorg"
                  height="32"
                  width="114"
                  style={{ border: 0, borderRadius: '6px', marginTop: '6px' }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      <DonateModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
