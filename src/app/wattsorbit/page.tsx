import type { Metadata } from 'next'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import { wattsOrbitContent } from '@/config/content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const { hero, features, comparison } = wattsOrbitContent

const ACCENT     = '#F59E0B'
const ACCENT_DIM = '#F59E0B18'
const ACCENT_MID = '#F59E0B50'
const BG_BASE    = '#0c0900'
const BG_CARD    = '#130f00'
const BORDER     = '#2a2000'

export const metadata: Metadata = {
  title: 'WattsOrbit — Real-time Mac power monitor | SlothLabs',
  description: 'WattsOrbit: menu bar app that shows real-time watts in/out, per-device USB power draw, cable quality testing, and smart battery alerts. Free, native macOS.',
  keywords: ['WattsOrbit', 'Mac power monitor', 'USB power', 'battery monitor', 'macOS menu bar', 'DynamoDB GUI', 'SlothLabs'],
  openGraph: {
    title: 'WattsOrbit — Real-time Mac power monitor | SlothLabs',
    description: 'Know exactly where your power is going. Per-device USB wattage, charger quality, solar-aware alerts. Free macOS menu bar app.',
    url: `${SITE_URL}/wattsorbit`,
    images: [{ url: '/images/wattsorbit-landing.png', width: 1200, height: 630, alt: 'WattsOrbit' }],
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/wattsorbit` },
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center noise overflow-hidden" style={{ background: BG_BASE }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 70% 40%, ${ACCENT}18 0%, transparent 60%)` }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 40% 50% at 15% 70%, ${ACCENT}0a 0%, transparent 60%)` }} />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#0c0900] to-transparent" />
      </div>

      <StarField count={50} />

      <div className="relative z-10 site-container w-full" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>
        <div className="w-full grid md:grid-cols-2 gap-10 lg:gap-16 items-center py-[52px]">
          {/* Left */}
          <div className="space-y-6 max-w-xl">
            <div className="fade-up" style={{ animationDelay: '0s' }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border" style={{ background: ACCENT_DIM, borderColor: ACCENT_MID, color: ACCENT }}>
                {hero.badge}
              </span>
            </div>

            <h1
              className="fade-up text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', animationDelay: '0.1s' }}
            >
              {hero.headline.split('\n').map((line, i) => (
                <span key={i} className="block" style={i === 1 ? { color: ACCENT } : { color: '#ffffff' }}>{line}</span>
              ))}
            </h1>

            <p className="fade-up text-lg text-[#8B7A55] leading-relaxed max-w-lg" style={{ animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.3s' }}>
              <a
                href="https://form.jotform.com/260731775592061"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
                style={{ background: ACCENT, color: BG_BASE }}
              >
                {hero.ctaPrimary}
              </a>
              <a href="#features" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all" style={{ borderColor: ACCENT_MID, color: ACCENT }}>
                {hero.ctaSecondary}
              </a>
            </div>

            <p className="fade-up text-xs" style={{ color: '#6b5300', animationDelay: '0.35s' }}>{hero.launchDate}</p>
          </div>

          {/* Right — hero image */}
          <div className="relative flex justify-center md:justify-end min-h-[280px] sm:min-h-[360px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full blur-3xl opacity-25" style={{ background: ACCENT }} />
            </div>
            <div
              className="relative z-10 w-full max-w-md aspect-square bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/images/wattsorbit-landing.png)' }}
              role="img" aria-label="WattsOrbit"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="py-28" style={{ background: BG_BASE }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Why WattsOrbit</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Power intelligence your Mac
            <span className="block" style={{ color: ACCENT }}>never had out of the box</span>
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 70}>
              <div
                className="group rounded-2xl p-6 border h-full flex flex-col hover:-translate-y-1 transition-all duration-200 relative overflow-hidden"
                style={{ background: BG_CARD, borderColor: BORDER }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${ACCENT}08 0%, transparent 70%)` }} />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200"
                    style={{ background: ACCENT_DIM }}>
                    {item.icon}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{item.title}</h3>
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ background: ACCENT_DIM, borderColor: ACCENT_MID, color: ACCENT }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#8B7A55' }}>{item.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Problem ───────────────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="py-24" style={{ background: BG_CARD }}>
      <div className="site-container">
        <ScrollReveal>
          <div className="rounded-2xl p-8 md:p-10 border flex flex-col md:flex-row gap-8 items-start" style={{ background: BG_BASE, borderColor: BORDER }}>
            <div className="text-4xl flex-shrink-0">🔋</div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                Your Mac has no built-in power intelligence
              </h3>
              <p style={{ color: '#8B7A55' }} className="leading-relaxed">
                Activity Monitor shows CPU and memory. iStatMenus shows temperature and battery percentage. Neither tells you what your 96W adapter is actually delivering, whether your USB-C cable is throttling power, or which connected device is draining your battery fastest.
              </p>
              <p style={{ color: '#8B7A55' }} className="leading-relaxed">
                If you work off a solar power bank in the field, off a generator on a shoot, or you just bought a USB-C hub and want to know how much it costs you — there was no tool for this. WattsOrbit reads directly from macOS power APIs and gives you the numbers, updated every 10 seconds, in a 380px popup that lives in your menu bar.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Comparison ────────────────────────────────────────────────────────────────

function Comparison() {
  const iconClass = (val: string) => {
    if (val.startsWith('✅')) return { color: ACCENT }
    if (val.startsWith('❌')) return { color: '#f87171' }
    if (val.startsWith('⚠️')) return { color: '#fbbf24' }
    return { color: '#4A6080', fontSize: '0.75rem' }
  }

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: BG_BASE }}>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl" style={{ background: `${ACCENT}20` }} />
      </div>

      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {comparison.headline}
          </h2>
          <p className="text-lg" style={{ color: '#8B7A55' }}>{comparison.sub}</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-4xl mx-auto overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="grid grid-cols-5" style={{ background: BG_CARD }}>
              {['Feature', 'WattsOrbit', 'Activity Monitor', 'iStatMenus', 'BatFi'].map((col, i) => (
                <div key={col} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: i === 1 ? ACCENT : '#4A6080', textAlign: i === 0 ? 'left' : 'center', borderRight: i < 4 ? `1px solid ${BORDER}` : 'none' }}>
                  {col}
                </div>
              ))}
            </div>
            {comparison.rows.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-5 border-t" style={{ background: i % 2 === 0 ? '#0a0800' : BG_BASE, borderColor: BORDER }}>
                <div className="px-4 py-4 text-sm" style={{ color: '#8B7A55', borderRight: `1px solid ${BORDER}` }}>{row.feature}</div>
                {[row.wattsorbit, row.activity, row.istat, row.batfi].map((val, j) => (
                  <div key={j} className="px-4 py-4 text-center text-sm font-medium" style={{ ...iconClass(val), borderRight: j < 3 ? `1px solid ${BORDER}` : 'none' }}>
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

const FREE_ITEMS = [
  'Real-time watts in / out',
  'Per-device USB wattage',
  'Charger & cable detection',
  'Battery health panel (cycles, health %, capacity)',
  'Temperature display & alerts',
  'Healthy-range indicator (20–80%)',
  'Charge-limit notification at 80%',
  'Power flow chart (today)',
  'Login-item autostart',
]

const PRO_ITEMS = [
  { icon: '🎯', label: 'Custom Charge Limit', desc: 'Stop charging at any % you choose — keeps long-term lifespan high.' },
  { icon: '⛵', label: 'Sailing Mode', desc: 'Discharge to a target level before plugging in — recalibrate your battery.' },
  { icon: '🔥', label: 'Heat Protection', desc: 'Auto-pause charging when battery temperature exceeds a threshold.' },
  { icon: '⬇️', label: 'Discharge Mode', desc: 'Force battery-only operation even while plugged in.' },
  { icon: '🔝', label: 'Top Up', desc: 'Temporarily override the charge limit and go to 100% for travel days.' },
  { icon: '📈', label: 'Export & Reporting', desc: 'CSV/JSON export, weekly summaries, and cycle-trend graphs.' },
]

function Roadmap() {
  return (
    <section id="roadmap" className="py-28" style={{ background: BG_CARD }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Roadmap</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Free now. Pro
            <span className="block" style={{ color: ACCENT }}>coming soon.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#8B7A55' }}>
            WattsOrbit&apos;s v1 is completely free. Pro features require writing to your Mac&apos;s SMC chip to directly control charging hardware — the same approach used by AlDente and coconutBattery Pro. That needs a signed privileged helper, ongoing Apple notarisation, and significant engineering to maintain safely. The Pro tier funds exactly that.
          </p>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Free column */}
          <ScrollReveal>
            <div className="rounded-2xl border h-full" style={{ background: BG_BASE, borderColor: '#1c4a1c' }}>
              <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#1c4a1c' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>v1.0 Free</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#14532d40', border: '1px solid #166534', color: '#4ade80' }}>
                    Available now
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#8B7A55' }}>Everything you need to understand your Mac&apos;s power — zero cost, forever.</p>
              </div>
              <ul className="px-6 py-5 space-y-3">
                {FREE_ITEMS.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#a3a3a3' }}>
                    <span style={{ color: '#4ade80', marginTop: '2px' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Pro column */}
          <ScrollReveal delay={80}>
            <div className="rounded-2xl border h-full" style={{ background: BG_BASE, borderColor: ACCENT_MID }}>
              <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: ACCENT_MID }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold" style={{ color: ACCENT, fontFamily: 'Syne, sans-serif' }}>v2.0 Pro</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: ACCENT_DIM, border: `1px solid ${ACCENT_MID}`, color: ACCENT }}>
                    In development
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#8B7A55' }}>Direct SMC control for battery longevity. Requires signed privileged helper — safety and notarisation cost us real engineering effort, which is why this tier exists.</p>
              </div>
              <ul className="px-6 py-5 space-y-4">
                {PRO_ITEMS.map(item => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-medium text-white">{item.label}</span>
                        <span className="text-xs px-1 py-0.5 rounded font-mono leading-none" style={{ background: ACCENT_DIM, color: ACCENT }}>Pro</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#8B7A55' }}>{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-6 pb-5">
                <a
                  href="https://form.jotform.com/260731775592061"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-5 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all"
                  style={{ background: ACCENT, color: BG_BASE }}
                >
                  Get notified when Pro launches →
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 border-y" style={{ background: BG_CARD, borderColor: BORDER }}>
      <div className="site-container text-center space-y-8">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Know where every watt is going
          </h2>
          <p className="text-lg mt-2" style={{ color: '#8B7A55' }}>WattsOrbit launches April 25. macOS only — Windows &amp; Linux coming soon.</p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="https://form.jotform.com/260731775592061"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: BG_BASE }}
            >
              Join the waitlist
            </a>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium transition-all hover:opacity-80" style={{ borderColor: ACCENT_MID, color: ACCENT }}>
              ← All SlothLabs tools
            </Link>
          </div>
          <p className="text-xs mt-4" style={{ color: '#4a3800' }}>Free forever. macOS only for now — Windows &amp; Linux coming soon. Native Rust binary.</p>
        </ScrollReveal>
      </div>
    </section>
  )
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WattsOrbit',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'macOS',
  description: 'Real-time Mac power monitor. Watts in/out, per-device USB draw, cable quality testing, smart battery alerts. Menu bar app.',
  url: `${SITE_URL}/wattsorbit`,
  author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function WattsOrbitPage() {
  return (
    <main style={{ background: BG_BASE }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CustomCursor />
      <ProductNavbar icon="⚡" iconSrc="/images/wattsorbit-icon.png" name="WattsOrbit" accent={ACCENT} />
      <Hero />
      <Features />
      <Problem />
      <Comparison />
      <Roadmap />
      <CTA />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
