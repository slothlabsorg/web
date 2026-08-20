import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import CustomCursor from '@/components/CustomCursor'
import { BackgroundSelector } from '@/components/WebGLBackgrounds'
import ProductCarousel from '@/components/ProductCarousel'
import SupportBanner from '@/components/SupportBanner'
import HeroMascotRotator from '@/components/HeroMascotRotator'
import NextBigReleaseHero from '@/components/NextBigReleaseHero'
import { slothLabsContent } from '@/config/content'
import { allReleases } from '@/data/releases'
import { nextUpcomingLaunch } from '@/data/upcomingLaunches'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'SlothLabs — Free Mac Dev Tools: AWS Client UI, DynamoDB GUI, Proxy Inspector & More',
  description: 'Free, open-source macOS dev tools by SlothLabs — CloudOrbit (AWS client UI), DataOrbit (DynamoDB GUI), ProxyOrbit (Charles Proxy alternative), BastionOrbit (SSH tunnel manager), WattsOrbit (Mac power monitor), and Mermaid Preview (JetBrains plugin). Native Rust, no Electron, no subscription.',
  keywords: [
    'free mac dev tools',
    'macOS developer tools',
    'native rust dev tools',
    'AWS client UI',
    'AWS GUI mac',
    'DynamoDB GUI',
    'DynamoDB client mac',
    'Charles Proxy alternative',
    'free HTTP proxy inspector mac',
    'SSH tunnel manager mac',
    'mac power monitor',
    'mac watts monitor',
    'Mermaid IntelliJ plugin',
    'Mermaid JetBrains plugin',
    'open source dev tools',
    'rust devops tools',
    'SlothLabs',
    'CloudOrbit',
    'DataOrbit',
    'ProxyOrbit',
    'BastionOrbit',
    'WattsOrbit',
    'Mermaid Preview',
  ],
  openGraph: {
    url: SITE_URL,
    title: 'SlothLabs — Free macOS Dev Tools: AWS GUI, DynamoDB Client, Proxy Inspector & More',
    description: 'Native Rust dev tools by SlothLabs — CloudOrbit (AWS client UI), DataOrbit (DynamoDB GUI), ProxyOrbit (Charles Proxy alternative), BastionOrbit (SSH tunnel manager), WattsOrbit (Mac power monitor), Mermaid Preview (JetBrains plugin). Free.',
    siteName: 'SlothLabs',
    images: [{ url: '/images/slothlabs-hero.png', width: 1200, height: 630, alt: 'SlothLabs — free macOS dev tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlothLabs — Free macOS Dev Tools: AWS GUI, DynamoDB Client, Proxy Inspector & More',
    description: 'AWS client UI, DynamoDB GUI, Charles Proxy alternative, SSH tunnel manager, Mac power monitor, Mermaid IntelliJ plugin. Free, native Rust, no Electron.',
    images: [`${SITE_URL}/images/slothlabs-hero.png`],
  },
  alternates: { canonical: SITE_URL },
}

const { hero, products } = slothLabsContent

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative noise" style={{ minHeight: 'min(100vh, 720px)' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#050d1f]" />
        <BackgroundSelector />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute rounded-full opacity-60 blur-[120px]"
            style={{
              width: '600px', height: '600px',
              top: '-10%', right: '-5%',
              background: 'radial-gradient(circle, rgba(77,166,255,0.2) 0%, rgba(0,212,255,0.1) 40%, transparent 70%)',
            }}
          />
          <div
            className="absolute rounded-full opacity-40 blur-[100px]"
            style={{
              width: '400px', height: '400px',
              bottom: '-15%', right: '10%',
              background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 65%)',
            }}
          />
        </div>
      </div>

      <div className="relative z-10 site-container flex items-center" style={{ minHeight: 'min(100vh, 720px)', paddingTop: '72px' }}>
        <div className="w-full grid grid-rows-1 md:grid-cols-2 items-start gap-10 lg:gap-14 py-[52px]">
          <HeroMascotRotator />

          <div className="min-w-0 overflow-visible space-y-6 order-1 md:order-2 text-center md:text-left">
            <h1
              className="fade-up w-fit break-words text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-[75px] font-bold leading-[1.1] text-white"
              style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, animationDelay: '0.1s' }}
            >
              {hero.headline.split('\n')[0]}
              <span className="hero-gradient-line block mt-1 font-extrabold">{hero.headline.split('\n')[1]}</span>
            </h1>

            <p className="fade-up text-lg text-[#8BA3C7] leading-relaxed w-[600px] max-w-full mx-auto md:mx-0" style={{ animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3 justify-center md:justify-start overflow-visible min-h-[80px] items-center" style={{ animationDelay: '0.3s' }}>
              <Link
                href="/#products"
                className="inline-flex items-center justify-center gap-0 w-[175px] h-10 px-8 py-3.5 rounded-full bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all glow-cta hover:-translate-y-0.5 active:translate-y-0 mt-5 mb-5"
              >
                {hero.cta}
              </Link>
              <Link href="/about" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-[#4DA6FF] text-sm hover:text-white transition-colors">
                {hero.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050d1f] to-transparent pointer-events-none z-10" />
    </section>
  )
}

// ── Products ──────────────────────────────────────────────────────────────────

function Products() {
  return (
    <section id="products" className="bg-[#050d1f] py-24">
      <div className="site-container">
        {/* Header */}
        <ScrollReveal className="text-center mb-5 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] mb-2">
            🚀 {products.launchBanner}
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {products.headline}
          </h2>
          <p className="text-[#8BA3C7] text-base lg:text-lg max-w-xl mx-auto">{products.sub}</p>
        </ScrollReveal>

        <ProductCarousel products={(() => {
          const NOW_TS = new Date().getTime()
          // Anchor launch cutoff at noon UTC (≈ 5am PT / 8am ET) so apps don't flip
          // to "live" the moment UTC midnight rolls over while it's still the prior day in the US.
          const launchTsUtcNoon = (s?: string): number => {
            if (!s) return NaN
            // Strict parser: only accept "Month DD, YYYY" (e.g. "June 15, 2026"). Strings like
            // "TBD 2026" would otherwise parse via V8's permissive fallback to Jan 1 of that
            // year and incorrectly flip the card to "Live" months early.
            if (!/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/.test(s)) {
              return NaN
            }
            const d = new Date(s)
            if (isNaN(d.getTime())) return NaN
            return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)
          }
          const decorated = products.items.map(p => {
            const key = p.slug.replace('/', '')
            const released = (allReleases[key]?.releases.length ?? 0) > 0
            const launchTs = launchTsUtcNoon(p.comingSoonDate)
            // comingSoonDate, when parseable, is the source of truth: if it's still in the
            // future, the app is gated even if releases exist (e.g., a v1 cut on GitHub but
            // the public launch was pushed back). When unparseable (e.g., "TBD 2026"), fall
            // back to the released flag.
            const isLive = !isNaN(launchTs) ? launchTs <= NOW_TS : released
            return {
              ...p,
              live: isLive,
              comingSoonDate: isLive ? '' : (p.comingSoonDate || 'Coming soon'),
              cta: isLive ? (released ? 'Download →' : 'Learn more →') : p.cta,
              _ts: isNaN(launchTs) ? Infinity : launchTs,
            }
          })
          // Sort: live first, then upcoming by earliest launch date
          decorated.sort((a, b) => {
            if (a.live && !b.live) return -1
            if (!a.live && b.live) return 1
            return a._ts - b._ts
          })
          return decorated as Parameters<typeof ProductCarousel>[0]['products']
        })()} />
      </div>
    </section>
  )
}

// ── Launch Roadmap ─────────────────────────────────────────────────────────────

const RAW_ROADMAP = [
  { name: 'CloudOrbit',   launchDate: '2026-08-24', date: 'Aug 24',  desc: 'AWS session manager',             accent: '#00D4FF', icon: '☁️', slug: '/cloudorbit' },
  { name: 'WattsOrbit',   launchDate: '2026-08-24', date: 'Aug 24',  desc: 'Mac power & USB monitor',         accent: '#F59E0B', icon: '⚡', slug: '/wattsorbit' },
  { name: 'DataOrbit',    launchDate: '2026-08-24', date: 'Aug 24',  desc: 'DynamoDB & CouchDB query client', accent: '#8B5CF6', icon: '🗄️', slug: '/dataorbit' },
  { name: 'klight',       launchDate: '2026-09-21', date: 'Sep 21',  desc: 'K8s dev environments for teams',  accent: '#B4FF3C', icon: '🚀', slug: '/klight' },
  { name: 'ProxyOrbit',   launchDate: '2026-09-07', date: 'Sep 7',   desc: 'HTTP/HTTPS proxy inspector',      accent: '#94A3B8', icon: '🔍', slug: '/proxyorbit' },
  { name: 'BastionOrbit', launchDate: '2026-09-14', date: 'Sep 14',  desc: 'SSH tunnel manager',              accent: '#10B981', icon: '🔐', slug: '/bastionorbit' },
  { name: 'runtime-orbit', launchDate: '2026-08-15', date: 'Aug 15', desc: "Borrow a machine's container runtime", accent: '#4F8CFF', icon: '🛰️', slug: '/runtime-orbit' },
]

// Compute status at build time — live items first, then upcoming by date.
// The earliest upcoming item is marked "Next release".
// Anchor cutoff at noon UTC so we don't flip "live" the moment UTC midnight passes.
const NOW = new Date()
const roadmapTs = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d, 12, 0, 0)
}
const ROADMAP = RAW_ROADMAP
  .map(r => ({ ...r, _ts: roadmapTs(r.launchDate), isLive: roadmapTs(r.launchDate) <= NOW.getTime() }))
  .sort((a, b) => {
    // Live first (in original order), then upcoming ascending by date
    if (a.isLive && !b.isLive) return -1
    if (!a.isLive && b.isLive) return 1
    return a._ts - b._ts
  })
  .map((r, i, arr) => {
    const firstUpcomingIdx = arr.findIndex(x => !x.isLive)
    return { ...r, isNext: !r.isLive && i === firstUpcomingIdx }
  })

function LaunchRoadmap() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/40 to-[#050d1f]" />

      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-14 space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Launch schedule</span>
          <h2
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            The first five of many more.
          </h2>
          <p className="text-[#8BA3C7] max-w-lg mx-auto">
            New tools shipping soon — all free, all native Rust, built to replace the apps that charge you for the privilege of doing your job.
          </p>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#1a3060] to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {ROADMAP.map((item, i) => (
              <ScrollReveal key={item.name} delay={i * 90}>
                <Link href={item.slug} className="block group">
                  <div className="flex flex-col items-center text-center gap-3">
                    {/* Node */}
                    <div
                      className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg z-10 bg-[#0d1b3e]"
                      style={{
                        borderColor: item.isLive ? `${item.accent}` : `${item.accent}50`,
                        boxShadow: item.isLive ? `0 0 24px ${item.accent}40` : undefined,
                      }}
                    >
                      {item.icon}
                      {item.isLive && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#10F5B0' }} />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-[#0d1b3e]" style={{ background: '#10F5B0' }} />
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    {item.isLive ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide"
                        style={{ borderColor: '#10F5B0', color: '#10F5B0', background: '#10F5B015' }}
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#10F5B0' }} />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10F5B0' }} />
                        </span>
                        LIVE
                      </span>
                    ) : item.isNext ? (
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: item.accent, background: `${item.accent}18`, border: `1px solid ${item.accent}50` }}
                        >
                          Next release
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{ borderColor: `${item.accent}40`, color: item.accent, background: `${item.accent}10` }}
                        >
                          {item.date}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{ borderColor: `${item.accent}40`, color: item.accent, background: `${item.accent}10` }}
                      >
                        {item.date}
                      </span>
                    )}

                    <div>
                      <p className="font-bold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{item.name}</p>
                      <p className="text-sm text-[#8BA3C7] mt-1">{item.desc}</p>
                    </div>

                    <span className="text-xs font-medium transition-colors" style={{ color: item.accent }}>
                      {item.isLive ? 'Download →' : 'See details →'}
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <ScrollReveal delay={300}>
          <p className="text-center text-xs text-[#4A6080] mt-14 max-w-md mx-auto">
            All tools are built with Rust + Tauri — native binaries, no Electron, no subscription. Free and open source.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

// ── Why Rust ──────────────────────────────────────────────────────────────────

const RUST_POINTS = [
  {
    icon: '⚡',
    title: 'Native binary. Zero runtime.',
    body: 'No Node.js. No V8. No JVM. Rust compiles directly to machine code — the binary runs the same way the OS itself does. Nothing between your CPU and our logic.',
    code: '$ du -sh WattsOrbit.app\n3.4M    WattsOrbit.app',
  },
  {
    icon: '🔬',
    title: 'Direct kernel APIs.',
    body: 'We call IOKit, SMC, libproc, and the macOS power subsystem directly — the same interfaces Apple uses internally. No wrappers, no polling hacks, no /proc file scraping.',
    code: 'IOServiceGetMatchingService(\n  kIOMasterPortDefault,\n  IOServiceMatching(\n    "AppleSmartBattery"\n  )\n)',
  },
  {
    icon: '🧠',
    title: 'Memory safe. GC free.',
    body: "Rust's ownership model eliminates data races and memory leaks at compile time — without a garbage collector. No GC pauses. No heap fragmentation. No undefined behavior.",
    code: '// 8 MB at rest.\n// Electron charges 200 MB\n// for hello world.',
  },
  {
    icon: '📦',
    title: 'Tauri v2, not Electron.',
    body: "Tauri uses the OS's native WebView — WKWebView on macOS. One renderer, no bundled Chromium. The result: a 3–5 MB installer and a UI that feels native because it is.",
    code: '// Electron: ~160 MB\n// Tauri:    ~4 MB\n// Same React UI, 40× smaller.',
  },
  {
    icon: '🔒',
    title: 'Auditable by design.',
    body: 'Every repo is MIT-licensed and fully open source. Read the Rust backend, the TypeScript UI, the CI pipeline. If something looks wrong, open an issue or a PR.',
    code: 'github.com/slothlabsorg\n# All source. All the time.',
  },
  {
    icon: '🌐',
    title: 'One codebase. Every OS.',
    body: "Tauri's Rust core runs on macOS, Linux, and Windows from the same source tree. macOS ships first because that's where we work. The rest follow without rewrites.",
    code: 'cargo build --target\n  aarch64-apple-darwin\n  x86_64-pc-windows-msvc\n  x86_64-unknown-linux-gnu',
  },
]

function WhyRust() {
  return (
    <section className="relative py-24 overflow-hidden border-t border-[#0e1f3a]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#060c18] to-[#050d1f]" />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-[0.06] pointer-events-none bg-[#4DA6FF]" />

      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-14 space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-[#1a3060] text-[#4A6080]">
            Under the hood
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Built the way software{' '}
            <span className="gradient-text">should</span> be built.
          </h2>
          <p className="text-[#8BA3C7] max-w-lg mx-auto">
            Every Orbit app is a native Rust binary with a Tauri UI. Here&apos;s what that means for you as a developer.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {RUST_POINTS.map((pt, i) => (
            <ScrollReveal key={pt.title} delay={i * 60}>
              <div className="rounded-2xl border border-[#1a3060] bg-[#060d1e] p-6 flex flex-col gap-4 h-full hover:border-[#4DA6FF]/30 transition-colors duration-300">
                <div className="text-3xl">{pt.icon}</div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {pt.title}
                  </h3>
                  <p className="text-[#8BA3C7] text-sm leading-relaxed">{pt.body}</p>
                </div>
                <pre
                  className="mt-auto rounded-lg px-4 py-3 text-[11px] leading-relaxed overflow-x-auto"
                  style={{ background: '#020810', color: '#4DA6FF', fontFamily: 'monospace' }}
                >
                  {pt.code}
                </pre>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200}>
          <p className="text-center text-xs text-[#4A6080] mt-12 max-w-md mx-auto">
            Rust + Tauri v2 · MIT license · No analytics · No telemetry · No subscription
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

// ── Other Tools teaser ────────────────────────────────────────────────────────
import { LIBRARY_LIST } from '@/data/libraries'

function OtherTools() {
  return (
    <section className="py-16 border-t border-[#0e1f3a]">
      <div className="site-container">
        <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Beyond the Orbit suite</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              Other tools
            </h2>
            <p className="text-[#8BA3C7] text-sm mt-1 max-w-md">
              IDE plugins, CLI tools, and polyglot developer libraries — all free, all open source.
            </p>
          </div>
          <Link
            href="/tools"
            className="flex-shrink-0 text-sm font-medium text-[#4DA6FF] hover:text-white transition-colors"
          >
            Browse all tools →
          </Link>
        </ScrollReveal>

        {/* Mermaid Preview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <ScrollReveal>
            <Link
              href="/mermaid-preview"
              className="group block rounded-2xl p-5 border border-[#1a3060] bg-[#060d1e] hover:border-[#FF3670]/40 hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#FF367012', border: '1px solid #FF367030' }}>
                  🧜
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Mermaid Preview</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold" style={{ color: '#FF3670', borderColor: '#FF367040', background: '#FF367012' }}>
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-[#4A6080] mt-0.5">JetBrains Plugin</p>
                </div>
              </div>
              <p className="text-[#8BA3C7] text-xs leading-relaxed">
                Live Mermaid diagram preview in a side panel. Per-block toggle, 250ms refresh, offline. All JetBrains IDEs 2023.3+.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold mt-4 block" style={{ color: '#FF3670' }}>
                Learn more →
              </span>
            </Link>
          </ScrollReveal>
        </div>

        {/* Developer libraries */}
        <ScrollReveal>
          <div className="flex items-center gap-2 mb-4 mt-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Developer libraries</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#1a3060] text-[#4A6080]">Rust · TS · Kotlin</span>
          </div>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIBRARY_LIST.map((lib, i) => (
            <ScrollReveal key={lib.slug} delay={i * 60}>
              <Link
                href={`/${lib.slug}`}
                className="group block rounded-2xl p-5 border border-[#1a3060] bg-[#060d1e] hover:-translate-y-1 transition-all duration-200"
                style={{ ['--hover-border' as string]: `${lib.accent}40` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: `${lib.accent}12`, border: `1px solid ${lib.accent}30` }}>
                    {lib.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm font-mono" style={{ fontFamily: 'monospace' }}>{lib.name}</h3>
                    <p className="text-[10px] text-[#4A6080] mt-0.5">{lib.tags.slice(0, 3).join(' · ')}</p>
                  </div>
                </div>
                <p className="text-[#8BA3C7] text-xs leading-relaxed line-clamp-3">{lib.tagline}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-1 flex-wrap">
                    {lib.install.npm && (
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-[#0d1b3e] text-[#4A6080] font-mono">npm i {lib.install.npm.replace('npm i ', '')}</code>
                    )}
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: lib.accent }}>→</span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Latest News ───────────────────────────────────────────────────────────────
type NewsItem = {
  id: string
  type: string
  priority: number
  publishedAt: string
  badge?: string
  badgeTone?: string
  title: string
  body: string
  action?: { label: string; url: string }
  targetApps: string[]
  sponsored?: boolean
}

function loadLatestNews(limit = 3): NewsItem[] {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'news', 'feed.json'), 'utf8')
    const feed: { items: NewsItem[] } = JSON.parse(raw)
    return (feed.items ?? [])
      .filter(i => !i.sponsored && i.type !== 'ad')
      .slice(0, limit)
  } catch { return [] }
}

const TONE_STYLE: Record<string, { bg: string; color: string }> = {
  primary: { bg: '#00D4FF20', color: '#7DD9FF' },
  success: { bg: '#10B98120', color: '#34D399' },
  warning: { bg: '#F59E0B20', color: '#FBBF24' },
  danger: { bg: '#F8717120', color: '#F87171' },
  neutral: { bg: '#94A3B820', color: '#CBD5E1' },
}

function LatestNews() {
  const items = loadLatestNews(3)
  if (items.length === 0) return null
  return (
    <section className="py-16 border-t border-[#0e1f3a]">
      <div className="site-container">
        <ScrollReveal className="flex items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Latest from SlothLabs</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>News & updates</h2>
          </div>
          <Link href="/news" className="flex-shrink-0 text-sm font-medium text-[#4DA6FF] hover:text-white transition-colors">
            All news →
          </Link>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const tone = TONE_STYLE[item.badgeTone ?? 'neutral'] ?? TONE_STYLE.neutral
            const bodyPreview = item.body.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^##.*$/gm, '').replace(/^- /gm, '').trim().slice(0, 120)
            return (
              <ScrollReveal key={item.id} delay={i * 80}>
                <div
                  className="rounded-2xl p-5 border h-full flex flex-col gap-3 hover:-translate-y-0.5 transition-transform duration-200"
                  style={{ background: '#0d1124', borderColor: '#1a2040' }}
                >
                  {item.badge && (
                    <span
                      className="self-start text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider"
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      {item.badge}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-white leading-snug" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#8BA3C7] leading-relaxed flex-1">
                    {bodyPreview}{bodyPreview.length >= 120 ? '…' : ''}
                  </p>
                  {item.action?.url && (
                    <Link
                      href={item.action.url}
                      className="text-xs font-medium transition-colors hover:opacity-80 mt-auto"
                      style={{ color: '#00D4FF' }}
                    >
                      {item.action.label} →
                    </Link>
                  )}
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const next = nextUpcomingLaunch()
  return (
    <main className="bg-[#050d1f]">
      <CustomCursor />
      <Navbar />
      <Hero />
      <NextBigReleaseHero launch={next} permalink={`/next/${next.slug}/`} variant="home" />
      <Products />
      <LaunchRoadmap />
      <OtherTools />
      <LatestNews />
      <WhyRust />
      <SupportBanner />
      <Footer />
    </main>
  )
}
