import type { Metadata } from 'next'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import { dataOrbitContent } from '@/config/content'
import MacInstallNote from '@/components/MacInstallNote'
import FundingSection from '@/components/FundingSection'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const { hero, features, comparison, screenshots } = dataOrbitContent

const ACCENT      = '#8B5CF6'
const ACCENT_DIM  = '#8B5CF620'
const ACCENT_MID  = '#8B5CF650'
const BG_CARD     = '#0d0d2e'
const BG_BASE     = '#060614'
const BORDER      = '#1e1b4b'

export const metadata: Metadata = {
  title: 'DataOrbit — DynamoDB & CouchDB client | SlothLabs',
  description: 'DataOrbit: native DynamoDB and CouchDB client. Real-time streaming, cross-join queries, full query history, no Electron. Free. By SlothLabs.',
  keywords: ['DataOrbit', 'DynamoDB client', 'CouchDB client', 'DynamoDB GUI', 'NoSQL client', 'SlothLabs'],
  openGraph: {
    title: 'DataOrbit — DynamoDB & CouchDB client | SlothLabs',
    description: 'DataOrbit: native DynamoDB and CouchDB client. Real-time streaming, cross-join queries, full query history, no Electron. Free. By SlothLabs.',
    url: `${SITE_URL}/dataorbit`,
    images: [{ url: '/images/dataorbit-landing.png', width: 1200, height: 630, alt: 'DataOrbit — DynamoDB & CouchDB client' }],
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/dataorbit` },
  twitter: {
    card: 'summary_large_image',
    title: 'DataOrbit — DynamoDB & CouchDB client | SlothLabs',
    description: 'Native DynamoDB and CouchDB client. Real-time streaming, cross-join queries, full query history, no Electron. Free.',
    images: [`${SITE_URL}/images/dataorbit-landing.png`],
  },
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center noise overflow-hidden" style={{ background: BG_BASE }}>
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 70% 40%, ${ACCENT}18 0%, transparent 60%)` }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 50% 50% at 20% 80%, ${ACCENT}0c 0%, transparent 60%)` }} />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#060614] to-transparent" />
      </div>

      <StarField count={60} />

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
                <span key={i} className={i === 1 ? 'block' : 'block text-white'} style={i === 1 ? { color: ACCENT } : {}}>{line}</span>
              ))}
            </h1>

            <p className="fade-up text-lg text-[#8BA3C7] leading-relaxed max-w-lg" style={{ animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.3s' }}>
              <a
                href="https://form.jotform.com/260731775592061"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm text-[#060614] hover:brightness-110 transition-all hover:-translate-y-0.5"
                style={{ background: ACCENT }}
              >
                {hero.ctaPrimary}
              </a>
              <a href="#features" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all" style={{ borderColor: ACCENT_MID, color: ACCENT }}>
                {hero.ctaSecondary}
              </a>
            </div>

            <p className="fade-up text-xs" style={{ color: '#6B5B9A', animationDelay: '0.35s' }}>{hero.launchDate}</p>
          </div>

          {/* Right — hero image */}
          <div className="relative flex justify-center md:justify-end min-h-[280px] sm:min-h-[360px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: ACCENT }} />
            </div>
            <div
              className="relative z-10 w-full max-w-md aspect-square bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/images/dataorbit-landing.png)' }}
              role="img" aria-label="DataOrbit"
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
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Why DataOrbit</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Everything the AWS console
            <span className="block" style={{ color: ACCENT }}>refuses to give you</span>
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
                  <p className="text-sm text-[#8BA3C7] leading-relaxed">{item.desc}</p>
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
            <div className="text-4xl flex-shrink-0">😤</div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                The AWS console is not a query tool. It&apos;s a form.
              </h3>
              <p className="text-[#8BA3C7] leading-relaxed">
                Every DynamoDB developer knows the pain: you open the AWS console, navigate five clicks to get to the table, type a raw JSON filter expression from memory, hit scan, and wait. Then the results don&apos;t paginate properly. Then you accidentally scan the whole table and wonder why your bill jumped.
              </p>
              <p className="text-[#8BA3C7] leading-relaxed">
                NoSQL Workbench was supposed to fix this. It&apos;s a Java app from 2020 that crashes on M1 Macs, has no streaming, and still makes you write JSON by hand. TablePlus treats DynamoDB as a second-class citizen. DataOrbit was built from scratch for DynamoDB — nothing bolted on, nothing compromised.
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
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl" style={{ background: `${ACCENT}15` }} />
      </div>

      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {comparison.headline}
          </h2>
          <p className="text-[#8BA3C7] text-lg">{comparison.sub}</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-4xl mx-auto overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="grid grid-cols-5" style={{ background: BG_CARD }}>
              {['Feature', 'DataOrbit', 'AWS Console', 'NoSQL Workbench', 'TablePlus'].map((col, i) => (
                <div key={col} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: i === 1 ? ACCENT : '#4A6080', textAlign: i === 0 ? 'left' : 'center', borderRight: i < 4 ? `1px solid ${BORDER}` : 'none' }}>
                  {col}
                </div>
              ))}
            </div>
            {comparison.rows.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-5 border-t" style={{ background: i % 2 === 0 ? '#080818' : BG_BASE, borderColor: BORDER }}>
                <div className="px-4 py-4 text-sm text-[#8BA3C7]" style={{ borderRight: `1px solid ${BORDER}` }}>{row.feature}</div>
                {[row.dataorbit, row.console, row.workbench, row.tableplus].map((val, j) => (
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

// ── Screenshots ───────────────────────────────────────────────────────────────

function Screenshots() {
  return (
    <section className="py-24" style={{ background: BG_CARD }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-12 space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4A6080' }}>Screenshots</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>See it in action</h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {screenshots.map((shot, i) => (
            <ScrollReveal key={shot.src} delay={i * 60}>
              <div className="rounded-xl overflow-hidden border group hover:border-[#8B5CF650] transition-colors" style={{ borderColor: BORDER }}>
                <div className="aspect-video bg-cover bg-top group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${shot.src})` }} />
                <p className="text-xs text-[#4A6080] p-3 text-center">{shot.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Funding ───────────────────────────────────────────────────────────────────

function Funding() {
  return (
    <FundingSection
      accent={ACCENT}
      appName="DataOrbit"
      iconSrc="/images/dataorbit-icon.png"
      repoSlug="dataorbit"
    />
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 border-y" style={{ background: BG_CARD, borderColor: BORDER }}>
      <div className="site-container text-center space-y-8">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ready to stop fighting the AWS console?
          </h2>
          <p className="text-[#8BA3C7] text-lg mt-2">DataOrbit launches May 1. Join the waitlist and be first.</p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="https://form.jotform.com/260731775592061"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm text-[#060614] hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT }}
            >
              Join the waitlist
            </a>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium transition-all hover:opacity-80" style={{ borderColor: ACCENT_MID, color: ACCENT }}>
              ← All SlothLabs tools
            </Link>
          </div>
          <p className="text-xs text-[#4A6080] mt-4">Free forever. Native Rust binary. No account required.</p>
          <MacInstallNote accent={ACCENT} />
        </ScrollReveal>
      </div>
    </section>
  )
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DataOrbit',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Windows, Linux',
  description: 'Native DynamoDB and CouchDB client with live streaming, cross-join, and query history. By SlothLabs.',
  url: `${SITE_URL}/dataorbit`,
  author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  softwareVersion: '0.1.0',
  downloadUrl: 'https://github.com/slothlabsorg/dataorbit/releases/latest',
  screenshot: `${SITE_URL}/images/dataorbit-landing.png`,
  releaseNotes: 'https://slothlabs.org/dataorbit/releases',
  license: 'https://opensource.org/licenses/MIT',
}

export default function DataOrbitPage() {
  return (
    <main style={{ background: BG_BASE }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CustomCursor />
      <ProductNavbar icon="🗄️" iconSrc="/images/dataorbit-icon.png" name="DataOrbit" accent={ACCENT} />
      <Hero />
      <Features />
      <Problem />
      <Comparison />
      <Screenshots />
      <Funding />
      <CTA />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
