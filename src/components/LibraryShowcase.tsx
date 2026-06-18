import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import type { LibraryMeta } from '@/data/libraries'

// Shared dark palette (matches the rest of the SlothLabs site).
const BG_BASE = '#050d1f'
const BG_CARD = '#060d1e'
const BG_CODE = '#04091a'
const BORDER = '#1a3060'
const TEXT_MUTED = '#8BA3C7'
const TEXT_DIM = '#4A6080'

function repoUrl(repo: string) {
  return `https://github.com/slothlabsorg/${repo}`
}

// ── Hero ────────────────────────────────────────────────────────────────────

function Hero({ lib }: { lib: LibraryMeta }) {
  const accent = lib.accent
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden" style={{ background: BG_BASE }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 70% 35%, ${accent}12 0%, transparent 60%)` }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 40% 50% at 12% 75%, ${accent}0a 0%, transparent 60%)` }} />
      </div>

      <StarField count={48} />

      <div className="relative z-10 site-container w-full" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>
        <div className="w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-[52px]">
          {/* Left */}
          <div className="space-y-6 max-w-xl">
            <div className="fade-up" style={{ animationDelay: '0s' }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border" style={{ background: `${accent}15`, borderColor: `${accent}40`, color: accent }}>
                {lib.badge}
              </span>
            </div>

            <h1
              className="fade-up text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight text-white"
              style={{ fontFamily: 'Syne, sans-serif', animationDelay: '0.1s' }}
            >
              {lib.headline}
            </h1>

            <p className="fade-up text-lg leading-relaxed max-w-lg" style={{ color: TEXT_MUTED, animationDelay: '0.2s' }}>
              {lib.tagline}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.3s' }}>
              <a
                href={repoUrl(lib.repo)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
                style={{ background: accent, color: BG_BASE }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                View on GitHub
              </a>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
                style={{ borderColor: `${accent}40`, color: accent }}
              >
                Browse all tools
              </Link>
            </div>

            <p className="fade-up text-xs" style={{ color: TEXT_DIM, animationDelay: '0.4s' }}>
              Open source · MIT license · Rust · TypeScript · Kotlin
            </p>
          </div>

          {/* Right — code preview */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: accent }} />
            </div>
            <CodeCard lib={lib} className="relative z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Code card (reused in hero + example section) ──────────────────────────────

function CodeCard({ lib, className = '' }: { lib: LibraryMeta; className?: string }) {
  return (
    <div className={`rounded-xl border overflow-hidden shadow-2xl ${className}`} style={{ background: BG_CODE, borderColor: BORDER }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: '#030712', borderColor: BORDER }}>
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="text-xs font-mono ml-2" style={{ color: TEXT_DIM }}>{lib.example.label}</span>
      </div>
      <pre className="p-5 text-[13px] font-mono leading-relaxed overflow-x-auto" style={{ color: '#c9d1d9' }}>
        <code>{lib.example.code}</code>
      </pre>
    </div>
  )
}

// ── What it is / why ──────────────────────────────────────────────────────────

function WhatItIs({ lib }: { lib: LibraryMeta }) {
  const accent = lib.accent
  return (
    <section className="py-24" style={{ background: BG_CARD }}>
      <div className="site-container">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>
              What it is
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {lib.description}
            </h2>
            <div className="space-y-4">
              {lib.whatItIs.map((para, i) => (
                <p key={i} className="text-base leading-relaxed" style={{ color: TEXT_MUTED }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────

function Features({ lib }: { lib: LibraryMeta }) {
  const accent = lib.accent
  return (
    <section className="py-28" style={{ background: BG_BASE }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>Why {lib.name}</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Built to get out of your way
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {lib.features.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 70}>
              <div
                className="group rounded-2xl p-6 border h-full flex flex-col hover:-translate-y-1 transition-all duration-200 relative overflow-hidden"
                style={{ background: BG_CARD, borderColor: BORDER }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${accent}0c 0%, transparent 70%)` }} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200"
                    style={{ background: `${accent}15` }}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-white text-base mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>{item.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Install ─────────────────────────────────────────────────────────────────

function InstallBlock({ label, lang, code, accent }: { label: string; lang: string; code: string; accent: string }) {
  return (
    <div className="rounded-xl border overflow-hidden h-full flex flex-col" style={{ background: BG_CODE, borderColor: BORDER }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: '#030712', borderColor: BORDER }}>
        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{label}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${accent}15`, color: accent }}>{lang}</span>
      </div>
      <pre className="p-4 text-[12.5px] font-mono leading-relaxed overflow-x-auto flex-1" style={{ color: '#c9d1d9' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Install({ lib }: { lib: LibraryMeta }) {
  const accent = lib.accent
  return (
    <section className="py-24" style={{ background: BG_CARD }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-14 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>Installation</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Add it in one line
          </h2>
          <p className="text-base" style={{ color: TEXT_MUTED }}>
            Same library, three ecosystems. Pick yours.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto items-stretch">
            <InstallBlock label="Rust" lang="cargo" code={lib.install.rust} accent={accent} />
            <InstallBlock label="TypeScript" lang="npm" code={lib.install.npm} accent={accent} />
            <InstallBlock label="Kotlin / JVM" lang="gradle · jitpack" code={lib.install.jitpack} accent={accent} />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <p className="text-xs text-center mt-6" style={{ color: TEXT_DIM }}>
            npm packages publish under the <span className="font-mono">@slothlabs</span> scope · JitPack builds from the git tag <span className="font-mono">v0.1.0</span>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Example ───────────────────────────────────────────────────────────────────

function Example({ lib }: { lib: LibraryMeta }) {
  const accent = lib.accent
  return (
    <section className="py-24" style={{ background: BG_BASE }}>
      <div className="site-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ScrollReveal className="space-y-5">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>In practice</span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              One small example
            </h2>
            <p className="leading-relaxed" style={{ color: TEXT_MUTED }}>
              {lib.tagline}
            </p>
            <div className="flex flex-wrap gap-2">
              {lib.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: `${accent}10`, borderColor: BORDER, color: accent }}>
                  {tag}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <CodeCard lib={lib} />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA({ lib }: { lib: LibraryMeta }) {
  const accent = lib.accent
  return (
    <section className="py-24 border-y" style={{ background: BG_CARD, borderColor: BORDER }}>
      <div className="site-container text-center space-y-8">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Try {lib.name} in your stack
          </h2>
          <p className="text-lg mt-2" style={{ color: TEXT_MUTED }}>
            Free and open source. Rust, TypeScript, or Kotlin — same semantics everywhere.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={repoUrl(lib.repo)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: accent, color: BG_BASE }}
            >
              View on GitHub
            </a>
            <Link href="/tools" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium transition-all hover:opacity-80" style={{ borderColor: `${accent}40`, color: accent }}>
              ← All SlothLabs tools
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function LibraryShowcase({ library }: { library: LibraryMeta }) {
  return (
    <main style={{ background: BG_BASE }}>
      <CustomCursor />
      <ProductNavbar
        icon={library.icon}
        name={library.name}
        accent={library.accent}
        ctaKind="link"
        ctaLabel="GitHub"
        ctaHref={repoUrl(library.repo)}
      />
      <Hero lib={library} />
      <WhatItIs lib={library} />
      <Features lib={library} />
      <Install lib={library} />
      <Example lib={library} />
      <CTA lib={library} />
      <Footer showSuiteLink accent={library.accent} />
    </main>
  )
}
