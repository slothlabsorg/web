import type { Metadata } from 'next'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import { bastionOrbitContent } from '@/config/content'
import MacInstallNote from '@/components/MacInstallNote'
import FundingSection from '@/components/FundingSection'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const { hero, features, comparison } = bastionOrbitContent

const ACCENT     = '#10B981'
const ACCENT_DIM = '#10B98118'
const ACCENT_MID = '#10B98150'
const BG_BASE    = '#030d09'
const BG_CARD    = '#060f0b'
const BORDER     = '#0d2b1e'

export const metadata: Metadata = {
  title: 'BastionOrbit — SSH tunnel manager | SlothLabs',
  description: 'BastionOrbit: one-click SSH tunnels with auto-expiry TTL. Manage bastion hosts, forward ports to databases and services, probe connectivity — free, native macOS.',
  keywords: ['BastionOrbit', 'SSH tunnel', 'bastion host', 'port forwarding', 'macOS', 'SlothLabs'],
  openGraph: {
    title: 'BastionOrbit — SSH tunnel manager | SlothLabs',
    description: 'One-click SSH tunnels that close themselves. Auto-expiry TTL, multi-bastion management, DataOrbit integration. Free macOS app.',
    url: `${SITE_URL}/bastionorbit`,
    images: [{ url: '/images/bastionorbit-landing.png', width: 1200, height: 630, alt: 'BastionOrbit' }],
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/bastionorbit` },
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center noise overflow-hidden" style={{ background: BG_BASE }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 70% 40%, ${ACCENT}18 0%, transparent 60%)` }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 40% 50% at 15% 70%, ${ACCENT}0a 0%, transparent 60%)` }} />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#030d09] to-transparent" />
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

            <p className="fade-up text-lg leading-relaxed max-w-lg" style={{ color: '#4a8a6a', animationDelay: '0.2s' }}>
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

            <p className="fade-up text-xs" style={{ color: '#0a4a2a', animationDelay: '0.35s' }}>{hero.launchDate}</p>
          </div>

          {/* Right — hero image */}
          <div className="relative flex justify-center md:justify-end min-h-[280px] sm:min-h-[360px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: ACCENT }} />
            </div>
            <div
              className="relative z-10 w-full max-w-md aspect-square bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/images/bastionorbit-landing.png)' }}
              role="img" aria-label="BastionOrbit"
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
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Why BastionOrbit</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            SSH tunnels that manage
            <span className="block" style={{ color: ACCENT }}>themselves</span>
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
                  <p className="text-sm leading-relaxed" style={{ color: '#4a8a6a' }}>{item.desc}</p>
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
            <div className="text-4xl flex-shrink-0">🔐</div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                Your SSH tunnel sticky note has too many entries
              </h3>
              <p style={{ color: '#4a8a6a' }} className="leading-relaxed">
                Every team has one: a Notion doc, a README, or a literal sticky note listing the SSH commands to forward prod-db, staging-redis, and that internal API gateway. You copy the command, open a terminal, remember which key file to use, and hope you closed last week's tunnel before you left on Friday.
              </p>
              <p style={{ color: '#4a8a6a' }} className="leading-relaxed">
                BastionOrbit replaces the sticky note. It stores your bastion hosts and targets, opens the real system <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: ACCENT_DIM, color: ACCENT }}>ssh -N -L</code> process with one click, sets a TTL so the tunnel closes automatically, and probes the remote port before you try to connect. Works with your existing <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: ACCENT_DIM, color: ACCENT }}>~/.ssh/config</code> and key agent — no protocol reimplementation.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Screenshots ───────────────────────────────────────────────────────────────

const SCREENSHOTS = [
  { src: '/images/bastionorbit-screen-home.png',    label: 'Bastion overview' },
  { src: '/images/bastionorbit-screen-tunnels.png', label: 'Active tunnels' },
  { src: '/images/bastionorbit-screen-wizard.png',  label: 'Add bastion wizard' },
  { src: '/images/bastionorbit-screen-settings.png',label: 'Settings' },
]

function Screenshots() {
  return (
    <section className="py-28" style={{ background: BG_BASE }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-14 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Screenshots</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            See it in action
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-5">
          {SCREENSHOTS.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 80}>
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
                <div className="aspect-video bg-cover bg-top" style={{ backgroundImage: `url(${s.src})` }} />
                <div className="px-4 py-3" style={{ background: BG_CARD }}>
                  <p className="text-sm font-medium" style={{ color: ACCENT }}>{s.label}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
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
    return { color: '#2a5a3a', fontSize: '0.75rem' }
  }

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: BG_CARD }}>
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {comparison.headline}
          </h2>
          <p className="text-lg" style={{ color: '#4a8a6a' }}>{comparison.sub}</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-4xl mx-auto overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="grid grid-cols-5" style={{ background: BG_BASE }}>
              {['Feature', 'BastionOrbit', 'Manual SSH', 'Teleport', 'VS Code Remote'].map((col, i) => (
                <div key={col} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: i === 1 ? ACCENT : '#2a5a3a', textAlign: i === 0 ? 'left' : 'center', borderRight: i < 4 ? `1px solid ${BORDER}` : 'none' }}>
                  {col}
                </div>
              ))}
            </div>
            {comparison.rows.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-5 border-t" style={{ background: i % 2 === 0 ? '#040e08' : BG_BASE, borderColor: BORDER }}>
                <div className="px-4 py-4 text-sm" style={{ color: '#4a8a6a', borderRight: `1px solid ${BORDER}` }}>{row.feature}</div>
                {[row.bastionorbit, row.manual, row.teleport, row.vscode].map((val, j) => (
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

// ── Funding ───────────────────────────────────────────────────────────────────

function Funding() {
  return (
    <FundingSection
      accent={ACCENT}
      appName="BastionOrbit"
      iconSrc="/images/bastionorbit-icon.png"
      repoSlug="bastionorbit"
    />
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 border-y" style={{ background: BG_BASE, borderColor: BORDER }}>
      <div className="site-container text-center space-y-8">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Never leave a tunnel open again
          </h2>
          <p className="text-lg mt-2" style={{ color: '#4a8a6a' }}>BastionOrbit launches May 8. Free macOS app. Native Rust binary.</p>
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
          <p className="text-xs mt-4" style={{ color: '#0a3a1a' }}>Free forever. macOS, Linux, Windows. Native Rust binary.</p>
          <MacInstallNote accent={ACCENT} />
        </ScrollReveal>
      </div>
    </section>
  )
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BastionOrbit',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Linux, Windows',
  description: 'SSH tunnel manager. One-click port forwarding through bastion hosts with auto-expiry TTL, connectivity probing, and DataOrbit integration.',
  url: `${SITE_URL}/bastionorbit`,
  author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function BastionOrbitPage() {
  return (
    <main style={{ background: BG_BASE }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CustomCursor />
      <ProductNavbar icon="🔐" iconSrc="/images/bastionorbit-icon.png" name="BastionOrbit" accent={ACCENT} />
      <Hero />
      <Features />
      <Problem />
      <Screenshots />
      <Comparison />
      <Funding />
      <CTA />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
