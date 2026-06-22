import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import CustomCursor from '@/components/CustomCursor'
import { allReleases } from '@/data/releases'
import { LIBRARY_LIST } from '@/data/libraries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'Other Tools — IDE plugins & utilities | SlothLabs',
  description: 'SlothLabs tools beyond the Orbit suite — IDE plugins, browser extensions, and developer utilities. Free, open source.',
  openGraph: {
    title: 'Other Tools | SlothLabs',
    description: 'IDE plugins and utilities from SlothLabs beyond the Orbit suite.',
    url: `${SITE_URL}/tools`,
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/tools` },
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    icon: '🧜',
    name: 'Mermaid Preview',
    href: '/mermaid-preview',
    releasesHref: '/mermaid-preview/releases',
    downloadHref: 'https://github.com/slothlabsorg/mermaid-preview-plugin/releases/download/v0.1.0/mermaid-preview-0.1.0.zip',
    accent: '#FF3670',
    category: 'JetBrains Plugin',
    desc: 'Renders every Mermaid diagram in your Markdown files live in a side panel. Per-block toggle between diagram and source, 250ms live-refresh, fully offline — Mermaid 10.9.3 bundled.',
    tags: ['JetBrains', 'Mermaid', 'Markdown', 'IntelliJ'],
    platform: 'All JetBrains IDEs 2023.3+',
    releaseKey: 'mermaid-preview',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-[0.06] bg-[#4DA6FF]" />
        </div>
        <div className="relative z-10 site-container text-center max-w-2xl mx-auto space-y-4">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#4DA6FF]/10 border border-[#4DA6FF]/30 text-[#4DA6FF]">
              Beyond the Orbit suite
            </span>
          </ScrollReveal>
          <ScrollReveal delay={60}>
            <h1
              className="text-4xl md:text-5xl font-bold text-white tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Other Tools
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <p className="text-[#8BA3C7] text-lg leading-relaxed">
              IDE plugins, CLI scripts, browser extensions, and one-trick tools for the gaps in your workflow —
              the moments the Orbit suite doesn&apos;t cover. Still free. Still open source.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Tools grid */}
      <section className="pb-24">
        <div className="site-container">

          {TOOLS.map((tool, i) => {
            const appReleases = allReleases[tool.releaseKey]
            const latest = appReleases?.releases[0]
            const released = (appReleases?.releases.length ?? 0) > 0

            return (
              <ScrollReveal key={tool.name} delay={i * 80}>
                <div
                  className="group rounded-2xl border p-6 md:p-8 mb-6 hover:border-opacity-60 transition-all duration-200"
                  style={{
                    background: '#060d1e',
                    borderColor: `${tool.accent}30`,
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">

                    {/* Icon + meta */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
                        style={{ background: `${tool.accent}12`, borderColor: `${tool.accent}30` }}
                      >
                        {tool.icon}
                      </div>
                      <div className="md:hidden">
                        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{tool.name}</h2>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full border font-semibold"
                          style={{ color: tool.accent, borderColor: `${tool.accent}40`, background: `${tool.accent}12` }}
                        >
                          {tool.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="hidden md:flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{tool.name}</h2>
                        <span
                          className="text-[11px] px-2.5 py-1 rounded-full border font-semibold"
                          style={{ color: tool.accent, borderColor: `${tool.accent}40`, background: `${tool.accent}12` }}
                        >
                          {tool.category}
                        </span>
                        {released && latest && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full border border-[#1a3060] text-[#4A6080] bg-[#060d1e] font-medium">
                            v{latest.version}
                          </span>
                        )}
                      </div>

                      <p className="text-[#8BA3C7] text-sm leading-relaxed">{tool.desc}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {tool.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-[#0d1b3e] text-[#4A6080] border border-[#1a3060]">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs" style={{ color: `${tool.accent}80` }}>{tool.platform}</p>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
                      {released && tool.downloadHref ? (
                        <a
                          href={tool.downloadHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                          style={{ background: tool.accent, color: '#fff' }}
                        >
                          Download
                        </a>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium border whitespace-nowrap"
                          style={{ borderColor: `${tool.accent}40`, color: tool.accent }}
                        >
                          Coming soon
                        </span>
                      )}
                      <Link
                        href={tool.href}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all whitespace-nowrap"
                        style={{ borderColor: '#1a3060', color: '#8BA3C7' }}
                      >
                        Learn more →
                      </Link>
                      {released && (
                        <Link
                          href={tool.releasesHref}
                          className="inline-flex items-center justify-center text-xs text-[#4A6080] hover:text-[#8BA3C7] transition-colors text-center"
                        >
                          Release notes
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}

          {/* Developer libraries */}
          <div className="mt-16 mb-8">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Developer libraries
                </h2>
                <span className="text-[11px] px-2.5 py-1 rounded-full border border-[#1a3060] text-[#4A6080] bg-[#060d1e] font-semibold">
                  Open source
                </span>
              </div>
              <p className="text-[#8BA3C7] text-sm leading-relaxed max-w-2xl">
                Small, polyglot libraries that solve one problem well — each shipping native implementations in
                Rust, TypeScript, and Kotlin from a single mono-repo.
              </p>
            </ScrollReveal>
          </div>

          {LIBRARY_LIST.map((lib, i) => (
            <ScrollReveal key={lib.slug} delay={i * 80}>
              <div
                className="group rounded-2xl border p-6 md:p-8 mb-6 hover:border-opacity-60 transition-all duration-200"
                style={{ background: '#060d1e', borderColor: `${lib.accent}30` }}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">

                  {/* Icon + meta */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
                      style={{ background: `${lib.accent}12`, borderColor: `${lib.accent}30` }}
                    >
                      {lib.icon}
                    </div>
                    <div className="md:hidden">
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{lib.name}</h3>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full border font-semibold"
                        style={{ color: lib.accent, borderColor: `${lib.accent}40`, background: `${lib.accent}12` }}
                      >
                        Library · Rust · TS · Kotlin
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="hidden md:flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{lib.name}</h3>
                      <span
                        className="text-[11px] px-2.5 py-1 rounded-full border font-semibold"
                        style={{ color: lib.accent, borderColor: `${lib.accent}40`, background: `${lib.accent}12` }}
                      >
                        Library · Rust · TS · Kotlin
                      </span>
                    </div>

                    <p className="text-[#8BA3C7] text-sm leading-relaxed">{lib.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {lib.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-[#0d1b3e] text-[#4A6080] border border-[#1a3060]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
                    <a
                      href={`https://github.com/slothlabsorg/${lib.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                      style={{ background: lib.accent, color: '#050d1f' }}
                    >
                      View on GitHub
                    </a>
                    <Link
                      href={`/${lib.slug}`}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all whitespace-nowrap"
                      style={{ borderColor: '#1a3060', color: '#8BA3C7' }}
                    >
                      Learn more →
                    </Link>
                    <Link
                      href={`/${lib.slug}/docs`}
                      className="inline-flex items-center justify-center text-xs hover:opacity-80 transition-colors text-center"
                      style={{ color: lib.accent }}
                    >
                      Docs →
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}

          {/* More coming note */}
          <ScrollReveal delay={200}>
            <div className="rounded-2xl border border-dashed border-[#1a3060] p-8 text-center space-y-3">
              <span className="text-2xl">🦥</span>
              <p className="text-[#4A6080] text-sm">More tools coming — Slothy is building them between naps.</p>
              <a
                href="https://github.com/slothlabsorg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#4DA6FF]/70 hover:text-[#4DA6FF] transition-colors"
              >
                Follow on GitHub to stay updated →
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Back to Orbit suite */}
      <section className="border-t border-[#0e1f3a] py-12">
        <div className="site-container text-center space-y-3">
          <p className="text-[#8BA3C7] text-sm">Looking for the main app suite?</p>
          <Link
            href="/#products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4DA6FF] hover:text-white transition-colors"
          >
            ← Browse the Orbit suite
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
