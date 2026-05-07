import type { Metadata } from 'next'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import MacInstallNote from '@/components/MacInstallNote'
import FundingSection from '@/components/FundingSection'
import { mermaidPreviewContent } from '@/config/content'
import { allReleases } from '@/data/releases'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const { hero, features, comparison, screenshots, install } = mermaidPreviewContent

const latestRelease = allReleases['mermaid-preview'].releases[0]

const ACCENT     = '#FF3670'
const ACCENT_DIM = '#FF367015'
const ACCENT_MID = '#FF367040'
const ACCENT_HI  = '#FF6B95'
const BG_BASE    = '#0a0308'
const BG_CARD    = '#0e060b'
const BORDER     = '#2a1020'

export const metadata: Metadata = {
  title: 'Mermaid Preview — Live diagram preview for JetBrains IDEs | SlothLabs',
  description: 'Mermaid Preview: JetBrains IDE plugin that renders every Mermaid diagram in your Markdown files live in a side panel. Per-block toggle, 250ms live refresh, fully offline. Free.',
  keywords: ['Mermaid Preview', 'JetBrains plugin', 'Mermaid diagrams', 'IntelliJ plugin', 'Markdown diagrams', 'mermaid IDE', 'SlothLabs'],
  openGraph: {
    title: 'Mermaid Preview — Live diagram preview for JetBrains IDEs | SlothLabs',
    description: 'Render every Mermaid diagram in your Markdown files live — side panel, per-block toggle, fully offline. Free JetBrains plugin.',
    url: `${SITE_URL}/mermaid-preview`,
    images: [{ url: '/images/mermaid-preview-screen-01.png', width: 1200, height: 630, alt: 'Mermaid Preview' }],
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/mermaid-preview` },
  twitter: {
    card: 'summary_large_image',
    title: 'Mermaid Preview — Live Mermaid diagrams in your JetBrains IDE | SlothLabs',
    description: 'Side-panel preview of every mermaid block in your Markdown files. Per-block toggle, live refresh, offline. Free plugin.',
    images: [`${SITE_URL}/images/mermaid-preview-screen-01.png`],
  },
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center noise overflow-hidden" style={{ background: BG_BASE }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 70% 40%, ${ACCENT}12 0%, transparent 60%)` }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 40% 50% at 15% 70%, ${ACCENT}08 0%, transparent 60%)` }} />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#0a0308] to-transparent" />
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

            <p className="fade-up text-lg leading-relaxed max-w-lg" style={{ color: '#7a3050', animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.3s' }}>
              <a
                href={hero.ctaPrimaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
                style={{ background: ACCENT, color: '#fff' }}
              >
                {hero.ctaPrimary}
              </a>
              <a
                href={hero.ctaSecondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
                style={{ borderColor: ACCENT_MID, color: ACCENT }}
              >
                {hero.ctaSecondary}
              </a>
            </div>

            <p className="fade-up text-xs" style={{ color: '#4a1028', animationDelay: '0.35s' }}>{hero.note}</p>
            <p className="fade-up text-xs" style={{ color: ACCENT_MID, animationDelay: '0.4s' }}>{hero.launchDate}</p>
          </div>

          {/* Right — screenshot */}
          <div className="relative flex justify-center md:justify-end min-h-[280px] sm:min-h-[360px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: ACCENT }} />
            </div>
            <div
              className="relative z-10 w-full max-w-lg rounded-xl overflow-hidden border"
              style={{ borderColor: BORDER }}
            >
              <img
                src="/images/mermaid-preview-screen-01.png"
                alt="Mermaid Preview — flowchart, sequence, and state machine side by side"
                className="w-full h-auto object-cover"
              />
            </div>
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
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Why Mermaid Preview</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Every diagram, rendered
            <span className="block" style={{ color: ACCENT_HI }}>where you already are</span>
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
                  <p className="text-sm leading-relaxed" style={{ color: '#7a4060' }}>{item.desc}</p>
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
            <div className="text-4xl flex-shrink-0">🔁</div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                Why does previewing a diagram take four steps?
              </h3>
              <p className="leading-relaxed" style={{ color: '#7a4060' }}>
                You write a mermaid block, select all, copy, alt-tab to mermaid.live, paste, wait for it to render, squint at the result, alt-tab back, edit, and repeat. Every time. The IntelliJ Markdown plugin does not render mermaid fences — it just shows the raw text. Browser extensions help but they live outside your IDE.
              </p>
              <p className="leading-relaxed" style={{ color: '#7a4060' }}>
                Mermaid Preview puts the rendered diagram right next to your code, updates as you type, and never leaves your IDE. The copy-paste loop stops the moment you install it.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Screenshots ───────────────────────────────────────────────────────────────

function Screenshots() {
  return (
    <section className="py-28" style={{ background: BG_BASE }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>In action</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            See it for yourself
          </h2>
          <p className="text-lg" style={{ color: '#7a4060' }}>Real screenshots from IntelliJ IDEA with the plugin installed.</p>
        </ScrollReveal>

        <div className="space-y-8">
          {screenshots.map((s, i) => (
            <ScrollReveal key={s.src} delay={i * 80}>
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
                <img
                  src={s.src}
                  alt={s.label}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="px-5 py-3 text-sm font-medium" style={{ background: BG_CARD, color: ACCENT_HI }}>
                  {s.label}
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
    if (val.startsWith('✅')) return { color: ACCENT_HI }
    if (val.startsWith('❌')) return { color: '#f87171' }
    if (val.startsWith('⚠️')) return { color: '#fbbf24' }
    return { color: '#4A6080', fontSize: '0.75rem' }
  }

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: BG_CARD }}>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl" style={{ background: `${ACCENT}20` }} />
      </div>

      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {comparison.headline}
          </h2>
          <p className="text-lg" style={{ color: '#7a4060' }}>{comparison.sub}</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-4xl mx-auto overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="grid grid-cols-5" style={{ background: BG_BASE }}>
              {['Feature', 'Mermaid Preview', 'mermaid.live', 'IntelliJ built-in', 'Browser ext'].map((col, i) => (
                <div key={col} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: i === 1 ? ACCENT_HI : '#4A6080', textAlign: i === 0 ? 'left' : 'center', borderRight: i < 4 ? `1px solid ${BORDER}` : 'none' }}>
                  {col}
                </div>
              ))}
            </div>
            {comparison.rows.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-5 border-t" style={{ background: i % 2 === 0 ? '#080206' : BG_BASE, borderColor: BORDER }}>
                <div className="px-4 py-4 text-sm" style={{ color: '#7a4060', borderRight: `1px solid ${BORDER}` }}>{row.feature}</div>
                {[row.mermaid, row.live, row.builtin, row.ext].map((val, j) => (
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

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="py-24 relative overflow-x-hidden" style={{ background: BG_BASE }}>
      <div className="relative z-10 site-container">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ScrollReveal className="space-y-6">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Under the hood</span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              JCEF webview,<br />mermaid bundled inside
            </h2>
            <p className="leading-relaxed" style={{ color: '#7a4060' }}>
              The plugin uses JCEF — the same Chromium-based webview JetBrains uses for its own DevTools. A <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: ACCENT_DIM, color: ACCENT_HI }}>DocumentListener</code> fires on every keystroke, debounced to 250ms, calling <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: ACCENT_DIM, color: ACCENT_HI }}>MermaidBlockExtractor</code> which parses the fences and sends a JSON payload to the embedded <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: ACCENT_DIM, color: ACCENT_HI }}>preview.html</code>.
            </p>
            <p className="leading-relaxed" style={{ color: '#7a4060' }}>
              Mermaid 10.9.3 is bundled inside the plugin zip — no CDN, no network call, no corporate proxy to fight. The webview reads the IDE theme token and switches between dark and light mermaid themes automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              {['JCEF webview', 'DocumentListener', 'Mermaid 10.9.3 bundled', 'No network required', 'Kotlin', 'IntelliJ Platform SDK'].map(pill => (
                <span key={pill} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: ACCENT_DIM, borderColor: BORDER, color: ACCENT_HI }}>
                  {pill}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="rounded-xl border overflow-hidden" style={{ background: '#060104', borderColor: BORDER }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: '#040103', borderColor: BORDER }}>
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono ml-2" style={{ color: '#4A6080' }}>diagram.md</span>
              </div>
              <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto" style={{ color: '#c9d1d9' }}>
                <code>
                  <span style={{ color: '#6e7681' }}>```mermaid{'\n'}</span>
                  <span style={{ color: '#c678dd' }}>sequenceDiagram</span>{'\n'}
                  {'    '}
                  <span style={{ color: '#e5c07b' }}>Alice</span>
                  <span style={{ color: '#56b6c2' }}> -&gt;&gt; </span>
                  <span style={{ color: '#e5c07b' }}>Bob</span>
                  {': Hello Bob\n'}
                  {'    '}
                  <span style={{ color: '#e5c07b' }}>Bob</span>
                  <span style={{ color: '#56b6c2' }}> -&gt;&gt; </span>
                  <span style={{ color: '#e5c07b' }}>Alice</span>
                  {': Hi Alice\n'}
                  {'    '}
                  <span style={{ color: '#e5c07b' }}>Alice</span>
                  <span style={{ color: '#56b6c2' }}> -&gt;&gt; </span>
                  <span style={{ color: '#e5c07b' }}>Bob</span>
                  {': Got a minute?\n'}
                  <span style={{ color: '#6e7681' }}>```</span>
                  {'\n\n'}
                  <span style={{ color: '#6e7681' }}>{'//'} ↑ type this in your .md file{'\n'}</span>
                  <span style={{ color: '#6e7681' }}>{'//'} ↓ see this in the Mermaid panel{'\n'}</span>
                  <span style={{ color: '#FF6B95' }}>rendered sequence diagram appears{'\n'}</span>
                  <span style={{ color: '#FF6B95' }}>in the right sidebar instantly ✨</span>
                </code>
              </pre>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── Install ───────────────────────────────────────────────────────────────────

function Install() {
  return (
    <section className="py-24" style={{ background: BG_CARD }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Installation</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Up and running in 4 steps
          </h2>
        </ScrollReveal>

        <div className="max-w-2xl mx-auto space-y-4">
          {install.map((step, i) => (
            <ScrollReveal key={step.n} delay={i * 80}>
              <div className="flex gap-5 items-start p-5 rounded-2xl border" style={{ background: BG_BASE, borderColor: BORDER }}>
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: ACCENT_DIM, color: ACCENT_HI, border: `1px solid ${ACCENT_MID}` }}
                >
                  {step.n}
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{step.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#7a4060' }}>{step.body}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="text-center mt-10">
            <a
              href={hero.ctaPrimaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: '#fff' }}
            >
              {hero.ctaPrimary}
            </a>
            <p className="text-xs mt-3" style={{ color: '#4a1028' }}>
              v{latestRelease.version} · {latestRelease.date} · MIT license · JetBrains IDEs 2023.3+
            </p>
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
      appName="Mermaid Preview"
      repoSlug="mermaid-preview-plugin"
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
            Stop alt-tabbing to mermaid.live
          </h2>
          <p className="text-lg mt-2" style={{ color: '#7a4060' }}>
            Free JetBrains plugin. Install in 4 steps. Works in every IntelliJ-based IDE.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={hero.ctaPrimaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: '#fff' }}
            >
              {hero.ctaPrimary}
            </a>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium transition-all hover:opacity-80" style={{ borderColor: ACCENT_MID, color: ACCENT }}>
              ← All SlothLabs tools
            </Link>
          </div>
          <p className="text-xs mt-4" style={{ color: '#4a1028' }}>Free forever · JetBrains IDEs 2023.3+ · MIT license</p>
          <MacInstallNote accent={ACCENT} />
        </ScrollReveal>
      </div>
    </section>
  )
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Mermaid Preview',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Windows, macOS, Linux',
  description: 'JetBrains IDE plugin that renders every Mermaid diagram in your Markdown files live in a side panel. Per-block toggle, live refresh, fully offline.',
  url: `${SITE_URL}/mermaid-preview`,
  author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  softwareVersion: '0.1.0',
  downloadUrl: 'https://github.com/slothlabsorg/mermaid-preview-plugin/releases/latest',
  screenshot: `${SITE_URL}/images/mermaid-preview-screen-01.png`,
  releaseNotes: `${SITE_URL}/mermaid-preview/releases`,
  license: 'https://opensource.org/licenses/MIT',
}

export default function MermaidPreviewPage() {
  return (
    <main style={{ background: BG_BASE }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CustomCursor />
      <ProductNavbar icon="🧜" name="Mermaid Preview" accent={ACCENT} />
      <Hero />
      <Features />
      <Problem />
      <Screenshots />
      <Comparison />
      <HowItWorks />
      <Install />
      <Funding />
      <CTA />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
