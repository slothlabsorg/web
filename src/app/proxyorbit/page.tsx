import type { Metadata } from 'next'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import { proxyOrbitContent } from '@/config/content'
import MacInstallNote from '@/components/MacInstallNote'
import FundingSection from '@/components/FundingSection'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const { hero, features, comparison } = proxyOrbitContent

const ACCENT     = '#94A3B8'
const ACCENT_DIM = '#94A3B815'
const ACCENT_MID = '#94A3B840'
const ACCENT_HI  = '#CBD5E1'
const BG_BASE    = '#070a0f'
const BG_CARD    = '#0c1018'
const BORDER     = '#1e2535'

export const metadata: Metadata = {
  title: 'ProxyOrbit — HTTP/HTTPS proxy inspector | SlothLabs',
  description: 'ProxyOrbit: native HTTP/HTTPS proxy inspector. Capture traffic from any app, filter requests, inspect in real time — free, Rust-native, not Charles Proxy. By SlothLabs.',
  keywords: ['ProxyOrbit', 'HTTP proxy inspector', 'Charles Proxy alternative', 'Proxyman alternative', 'HTTPS inspector', 'SlothLabs'],
  openGraph: {
    title: 'ProxyOrbit — HTTP/HTTPS proxy inspector | SlothLabs',
    description: 'Capture every API call from every app. Filter by method, status, protocol. Free, Rust-native. No Charles subscription needed.',
    url: `${SITE_URL}/proxyorbit`,
    images: [{ url: '/images/proxyorbit-landing.png', width: 1200, height: 630, alt: 'ProxyOrbit' }],
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/proxyorbit` },
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center noise overflow-hidden" style={{ background: BG_BASE }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 70% 40%, ${ACCENT}12 0%, transparent 60%)` }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 40% 50% at 15% 70%, ${ACCENT}08 0%, transparent 60%)` }} />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#070a0f] to-transparent" />
      </div>

      <StarField count={50} />

      <div className="relative z-10 site-container w-full" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>
        <div className="w-full grid md:grid-cols-2 gap-10 lg:gap-16 items-center py-[52px]">
          {/* Left */}
          <div className="space-y-6 max-w-xl">
            <div className="fade-up" style={{ animationDelay: '0s' }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border" style={{ background: ACCENT_DIM, borderColor: ACCENT_MID, color: ACCENT_HI }}>
                {hero.badge}
              </span>
            </div>

            <h1
              className="fade-up text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', animationDelay: '0.1s' }}
            >
              {hero.headline.split('\n').map((line, i) => (
                <span key={i} className="block" style={i === 1 ? { color: ACCENT_HI } : { color: '#ffffff' }}>{line}</span>
              ))}
            </h1>

            <p className="fade-up text-lg leading-relaxed max-w-lg" style={{ color: '#64748B', animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.3s' }}>
              <a
                href="https://form.jotform.com/260731775592061"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
                style={{ background: ACCENT_HI, color: BG_BASE }}
              >
                {hero.ctaPrimary}
              </a>
              <a href="#features" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all" style={{ borderColor: ACCENT_MID, color: ACCENT }}>
                {hero.ctaSecondary}
              </a>
            </div>

            <p className="fade-up text-xs" style={{ color: '#334155', animationDelay: '0.35s' }}>{hero.launchDate}</p>
          </div>

          {/* Right — hero image */}
          <div className="relative flex justify-center md:justify-end min-h-[280px] sm:min-h-[360px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: ACCENT_HI }} />
            </div>
            <div
              className="relative z-10 w-full max-w-md aspect-square bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/images/proxyorbit-landing.png)' }}
              role="img" aria-label="ProxyOrbit"
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
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Why ProxyOrbit</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Debug HTTP/HTTPS the way
            <span className="block" style={{ color: ACCENT_HI }}>it was meant to be</span>
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
                  style={{ background: `radial-gradient(circle at 50% 0%, ${ACCENT}06 0%, transparent 70%)` }} />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200"
                    style={{ background: ACCENT_DIM }}>
                    {item.icon}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{item.title}</h3>
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ background: ACCENT_DIM, borderColor: ACCENT_MID, color: ACCENT_HI }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{item.desc}</p>
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
            <div className="text-4xl flex-shrink-0">💸</div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                Debugging HTTP shouldn&apos;t cost $50–$69 a year
              </h3>
              <p className="leading-relaxed" style={{ color: '#64748B' }}>
                Charles Proxy is $50 and runs on Java — cold-start takes seconds, it looks like it was designed in 2008, and every update requires a new license. Proxyman is $69/year built on Electron, which means it&apos;s a Chromium browser pretending to be a proxy inspector. mitmproxy works, but it&apos;s a terminal tool — not a great experience when you&apos;re already juggling five browser tabs and three terminal windows.
              </p>
              <p className="leading-relaxed" style={{ color: '#64748B' }}>
                ProxyOrbit is a native Rust app. The proxy engine is built on Hyper and Tokio — the same async stack powering large-scale Rust services. It starts instantly, uses under 30 MB of RAM, and costs exactly zero dollars. Because inspecting your own HTTP traffic is a basic developer tool, not a paid service.
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
    if (val.startsWith('✅')) return { color: ACCENT_HI }
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
          <p className="text-lg" style={{ color: '#64748B' }}>{comparison.sub}</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-4xl mx-auto overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="grid grid-cols-5" style={{ background: BG_CARD }}>
              {['Feature', 'ProxyOrbit', 'Charles Proxy', 'Proxyman', 'mitmproxy'].map((col, i) => (
                <div key={col} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: i === 1 ? ACCENT_HI : '#4A6080', textAlign: i === 0 ? 'left' : 'center', borderRight: i < 4 ? `1px solid ${BORDER}` : 'none' }}>
                  {col}
                </div>
              ))}
            </div>
            {comparison.rows.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-5 border-t" style={{ background: i % 2 === 0 ? '#060810' : BG_BASE, borderColor: BORDER }}>
                <div className="px-4 py-4 text-sm" style={{ color: '#64748B', borderRight: `1px solid ${BORDER}` }}>{row.feature}</div>
                {[row.proxyorbit, row.charles, row.proxyman, row.mitm].map((val, j) => (
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

// ── Rust section ──────────────────────────────────────────────────────────────

function RustSection() {
  return (
    <section className="py-24 relative overflow-x-hidden" style={{ background: BG_CARD }}>
      <div className="relative z-10 site-container">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ScrollReveal className="space-y-6">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Built with Rust + Tauri</span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              A proxy engine, not<br />a browser pretending to be one
            </h2>
            <p className="leading-relaxed" style={{ color: '#64748B' }}>
              ProxyOrbit&apos;s proxy server is written in Rust using Hyper (the HTTP library powering major cloud infrastructure) and Tokio (the async runtime). The result: sub-millisecond request routing, zero GC pauses, and a binary that starts before you lift your finger off the icon.
            </p>
            <div className="flex flex-wrap items-center gap-4 py-4">
              {[{ value: '< 30 MB', label: 'RAM at idle' }, { value: '< 1s', label: 'startup time' }, { value: '0', label: 'GC pauses' }].map((stat, i) => (
                <span key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-xl font-bold" style={{ color: ACCENT_HI }}>{stat.value}</span>
                  <span className="text-sm" style={{ color: '#4A6080' }}>{stat.label}</span>
                  {i < 2 && <span className="w-px h-6 mx-1" style={{ background: BORDER }} aria-hidden />}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {['Memory-safe by design', 'No JVM warm-up', 'No Chromium overhead', 'Hyper HTTP engine', 'Tokio async runtime'].map(pill => (
                <span key={pill} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: ACCENT_DIM, borderColor: BORDER, color: '#8BA3C7' }}>
                  {pill}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="rounded-xl border overflow-hidden" style={{ background: '#050810', borderColor: BORDER }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: '#030508', borderColor: BORDER }}>
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono ml-2" style={{ color: '#4A6080' }}>proxy.rs</span>
              </div>
              <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto" style={{ color: '#c9d1d9' }}>
                <code>
                  <span style={{ color: '#8BA3C7' }}>// Hyper service — handles each request{'\n'}</span>
                  <span style={{ color: '#8BA3C7' }}>// with zero-copy forwarding{'\n'}</span>
                  <span style={{ color: '#c678dd' }}>async fn</span>{' '}
                  <span style={{ color: '#61afef' }}>handle</span>
                  {'(req: Request<Body>,\n'}
                  {'        state: Arc<ProxyState>) -> Result<Response<Body>> {\n'}
                  {'    '}
                  <span style={{ color: '#c678dd' }}>let</span>{' entry = ProxyEntry::capture('}
                  <span style={{ color: '#56b6c2' }}>&amp;</span>req);\n
                  {'    '}
                  <span style={{ color: '#c678dd' }}>let</span>{' resp  = forward(req).await'}
                  <span style={{ color: '#56b6c2' }}>?</span>{';\n'}
                  {'    state.emit_entry(entry.with_response('}
                  <span style={{ color: '#56b6c2' }}>&amp;</span>resp));\n
                  {'    '}
                  <span style={{ color: '#e5c07b' }}>Ok</span>{'(resp)\n}'}
                </code>
              </pre>
            </div>
          </ScrollReveal>
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
      appName="ProxyOrbit"
      iconSrc="/images/proxyorbit-icon.png"
      repoSlug="proxyorbit"
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
            Stop paying Charles every year
          </h2>
          <p className="text-lg mt-2" style={{ color: '#64748B' }}>ProxyOrbit launches April 24. Free, native, forever.</p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="https://form.jotform.com/260731775592061"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT_HI, color: BG_BASE }}
            >
              Join the waitlist
            </a>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium transition-all hover:opacity-80" style={{ borderColor: ACCENT_MID, color: ACCENT }}>
              ← All SlothLabs tools
            </Link>
          </div>
          <p className="text-xs mt-4" style={{ color: '#1e2535' }}>Free forever. Rust native binary. No subscription.</p>
          <MacInstallNote accent={ACCENT} />
        </ScrollReveal>
      </div>
    </section>
  )
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ProxyOrbit',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS',
  description: 'Native HTTP/HTTPS proxy inspector. Capture traffic, filter requests, inspect in real time. Free Charles Proxy alternative built in Rust.',
  url: `${SITE_URL}/proxyorbit`,
  author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function ProxyOrbitPage() {
  return (
    <main style={{ background: BG_BASE }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CustomCursor />
      <ProductNavbar icon="🔍" iconSrc="/images/proxyorbit-icon.png" name="ProxyOrbit" accent={ACCENT} />
      <Hero />
      <Features />
      <Problem />
      <Comparison />
      <RustSection />
      <Funding />
      <CTA />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
