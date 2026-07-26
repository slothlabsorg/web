import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import ScrollReveal from '@/components/ScrollReveal'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'Advertise with SlothLabs — Reach macOS Developers & Cloud Engineers',
  description:
    'Promote your product to AWS engineers, Kubernetes operators, and macOS power users through in-app and web placements across the SlothLabs Orbit suite.',
  keywords: ['SlothLabs', 'advertise', 'sponsor', 'macOS developers', 'cloud engineers', 'AWS', 'Kubernetes'],
  openGraph: {
    title: 'Advertise with SlothLabs — Reach macOS Developers & Cloud Engineers',
    description:
      'Promote your product to AWS engineers, Kubernetes operators, and macOS power users through in-app and web placements across the SlothLabs Orbit suite.',
    url: `${SITE_URL}/advertise`,
    siteName: 'SlothLabs',
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/advertise` },
}

export default function AdvertisePage() {
  return (
    <main className="min-h-screen relative" style={{ background: '#050818' }}>
      <CustomCursor />
      <StarField count={80} />
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4FF]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00D4FF]/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 site-container text-center">
          <ScrollReveal>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest mb-6"
              style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              ADVERTISING
            </span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 whitespace-pre-line"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              {'Reach the engineers\nwho ship on macOS'}
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#8BA3C7' }}>
              CloudOrbit, DataOrbit, and WattsOrbit users are AWS engineers, Kubernetes operators, and macOS power users.
              Your ad reaches them in-app and on the web.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { value: '3 apps', label: 'CloudOrbit · DataOrbit · WattsOrbit' },
              { value: 'In-app + Web', label: 'News tab in every Orbit app + /news page' },
              { value: 'Clearly labelled', label: 'Sponsored badge on every placement' },
            ].map((stat, i) => (
              <ScrollReveal key={stat.value} delay={i * 100}>
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: '#0d1124', border: '1px solid #1a2040' }}
                >
                  <p
                    className="text-2xl md:text-3xl font-bold text-white mb-2"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ color: '#8BA3C7' }} className="text-sm">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Placement Options ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container">
          <ScrollReveal>
            <h2
              className="text-3xl md:text-4xl font-bold text-white text-center mb-4"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Placement options
            </h2>
            <p className="text-center mb-12 max-w-xl mx-auto" style={{ color: '#8BA3C7' }}>
              Two surfaces, one unified placement. Your message appears where developers already look for updates.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <ScrollReveal delay={100}>
              <div
                className="rounded-2xl p-8 h-full flex flex-col"
                style={{ background: '#0d1124', border: '1px solid #1a2040' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📱</span>
                  <h3
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    In-App News Feed
                  </h3>
                </div>
                <ul className="space-y-3 text-sm flex-1" style={{ color: '#8BA3C7' }}>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00D4FF' }}>▸</span>
                    Appears in the News tab of every Orbit app
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00D4FF' }}>▸</span>
                    Format: title, markdown body, SPONSOR badge, CTA button
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00D4FF' }}>▸</span>
                    Reach: all active users who open the News tab
                  </li>
                </ul>
                <div className="mt-6 pt-4 border-t" style={{ borderColor: '#1a2040' }}>
                  <p className="text-sm font-semibold" style={{ color: '#00D4FF' }}>
                    Contact us for pricing
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal delay={200}>
              <div
                className="rounded-2xl p-8 h-full flex flex-col"
                style={{ background: '#0d1124', border: '1px solid #1a2040' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🌐</span>
                  <h3
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Web News Page (/news)
                  </h3>
                </div>
                <ul className="space-y-3 text-sm flex-1" style={{ color: '#8BA3C7' }}>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00D4FF' }}>▸</span>
                    Appears on slothlabs.org/news
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00D4FF' }}>▸</span>
                    Same format, same content as in-app
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00D4FF' }}>▸</span>
                    Reach: web visitors of the news feed
                  </li>
                </ul>
                <div className="mt-6 pt-4 border-t" style={{ borderColor: '#1a2040' }}>
                  <p className="text-sm font-semibold" style={{ color: '#00D4FF' }}>
                    Included with in-app placement
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Ko-fi Support ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container text-center">
          <ScrollReveal>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Support SlothLabs
            </h2>
            <p className="max-w-xl mx-auto mb-8" style={{ color: '#8BA3C7' }}>
              All SlothLabs apps are free and open source. If you find them useful, consider buying us a coffee or
              becoming a supporter on Ko-fi.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <a
              href="https://ko-fi.com/slothlabs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:brightness-110 hover:scale-105"
              style={{ background: '#F59E0B', color: '#1a1a1a' }}
            >
              <span className="text-lg">☕</span>
              Support us on Ko-fi
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── CTA / Contact ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container text-center">
          <ScrollReveal>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Get in touch
            </h2>
            <p className="max-w-xl mx-auto mb-8" style={{ color: '#8BA3C7' }}>
              Send us an email with your campaign details and we&apos;ll get back to you within 24 hours.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <a
              href="mailto:hello@slothlabs.org?subject=Advertising%20Inquiry&body=Hi%2C%20I%27m%20interested%20in%20advertising%20with%20SlothLabs."
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:brightness-110 hover:scale-105"
              style={{ background: '#00D4FF', color: '#050818' }}
            >
              Send advertising inquiry
            </a>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-sm" style={{ color: '#8BA3C7' }}>
              Or reach us on{' '}
              <a
                href="https://github.com/slothlabsorg"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-white transition-colors"
                style={{ color: '#00D4FF' }}
              >
                GitHub Discussions
              </a>
            </p>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  )
}
