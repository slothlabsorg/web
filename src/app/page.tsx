import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import CustomCursor from '@/components/CustomCursor'
import HeroParallaxBg from '@/components/HeroParallaxBg'
import ProductCarousel from '@/components/ProductCarousel'
import SupportBanner from '@/components/SupportBanner'
import HeroMascotRotator from '@/components/HeroMascotRotator'
import { slothLabsContent } from '@/config/content'
import { allReleases } from '@/data/releases'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'SlothLabs — Dev tools that give you your time back',
  description: 'SlothLabs builds native dev tools for developers and DevOps. DataOrbit, ProxyOrbit, WattsOrbit, CloudOrbit — less friction, more shipping.',
  keywords: ['SlothLabs', 'dev tools', 'developer tools', 'CloudOrbit', 'DataOrbit', 'WattsOrbit', 'ProxyOrbit'],
  openGraph: {
    url: SITE_URL,
    title: 'SlothLabs — Dev tools that give you your time back',
    description: 'Native Rust dev tools: DataOrbit, ProxyOrbit, WattsOrbit, CloudOrbit. By devs, for devs.',
    siteName: 'SlothLabs',
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
        <HeroParallaxBg />
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

        <ProductCarousel products={products.items.map(p => {
          const key = p.slug.replace('/', '')
          const released = (allReleases[key]?.releases.length ?? 0) > 0
          return {
            ...p,
            comingSoonDate: released ? '' : (p.comingSoonDate || 'Coming soon'),
            cta: released ? 'Download →' : p.cta,
          }
        }) as Parameters<typeof ProductCarousel>[0]['products']} />
      </div>
    </section>
  )
}

// ── Launch Roadmap ─────────────────────────────────────────────────────────────

const ROADMAP = [
  { name: 'WattsOrbit',   date: 'April 28', desc: 'Mac power & USB monitor',         accent: '#F59E0B', icon: '⚡', slug: '/wattsorbit' },
  { name: 'ProxyOrbit',   date: 'May 5',    desc: 'HTTP/HTTPS proxy inspector',      accent: '#94A3B8', icon: '🔍', slug: '/proxyorbit' },
  { name: 'DataOrbit',    date: 'May 15',   desc: 'DynamoDB & CouchDB query client', accent: '#8B5CF6', icon: '🗄️', slug: '/dataorbit' },
  { name: 'BastionOrbit', date: 'May 27',   desc: 'SSH tunnel manager',              accent: '#10B981', icon: '🔐', slug: '/bastionorbit' },
  { name: 'CloudOrbit',   date: 'Mid-June', desc: 'AWS session manager',             accent: '#00D4FF', icon: '☁️', slug: '/cloudorbit' },
]

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
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative z-10 bg-[#0d1b3e]"
                      style={{
                        borderColor: `${item.accent}50`,
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* Date badge */}
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{ borderColor: `${item.accent}40`, color: item.accent, background: `${item.accent}10` }}
                    >
                      {item.date}
                    </span>

                    <div>
                      <p className="font-bold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{item.name}</p>
                      <p className="text-sm text-[#8BA3C7] mt-1">{item.desc}</p>
                    </div>

                    <span className="text-xs font-medium transition-colors" style={{ color: item.accent }}>
                      See details →
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

export default function HomePage() {
  return (
    <main className="bg-[#050d1f]">
      <CustomCursor />
      <Navbar />
      <Hero />
      <Products />
      <LaunchRoadmap />
      <WhyRust />
      <SupportBanner />
      <Footer />
    </main>
  )
}
