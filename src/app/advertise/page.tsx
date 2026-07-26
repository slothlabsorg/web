import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import ScrollReveal from '@/components/ScrollReveal'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'Advertise with SlothLabs — Reach macOS Developers & Mobile Users',
  description:
    'Promote your product to AWS engineers, Kubernetes operators, macOS power users, and a growing mobile audience across the SlothLabs suite — desktop Orbit apps today, iOS & Android apps launching soon.',
  keywords: ['SlothLabs', 'advertise', 'sponsor', 'macOS developers', 'cloud engineers', 'AWS', 'Kubernetes', 'iOS', 'Android', 'mobile'],
  openGraph: {
    title: 'Advertise with SlothLabs — Reach macOS Developers & Mobile Users',
    description:
      'In-app and web placements across the growing SlothLabs suite. Desktop Orbit apps today, iOS & Android apps on the way.',
    url: `${SITE_URL}/advertise`,
    siteName: 'SlothLabs',
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/advertise` },
}

const DESKTOP_APPS = [
  { icon: '☁️', name: 'CloudOrbit',     desc: 'AWS session manager',         accent: '#00D4FF' },
  { icon: '🗄️', name: 'DataOrbit',      desc: 'DynamoDB GUI client',          accent: '#8B5CF6' },
  { icon: '⚡', name: 'WattsOrbit',     desc: 'Battery & power monitor',      accent: '#F59E0B' },
  { icon: '🔐', name: 'BastionOrbit',   desc: 'SSH tunnel manager',           accent: '#10B981' },
  { icon: '🔍', name: 'ProxyOrbit',     desc: 'HTTP/HTTPS proxy inspector',   accent: '#94A3B8' },
  { icon: '🚀', name: 'klight',         desc: 'Kubernetes env manager',       accent: '#B4FF3C' },
  { icon: '🧜', name: 'MermaidPreview', desc: 'JetBrains diagram plugin',     accent: '#FF3670' },
]

const MOBILE_APPS = [
  { icon: '📡', name: 'DropOrbit',   desc: 'Cross-platform AirDrop — iOS, Android, macOS, Windows', accent: '#06B6D4', status: 'Coming soon' },
]

export default function AdvertisePage() {
  return (
    <main className="min-h-screen relative" style={{ background: '#050818' }}>
      <CustomCursor />
      <StarField count={80} />
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D4FF]/8 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8B5CF6]/6 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4" />
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
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Reach the engineers<br />
              <span style={{ color: '#00D4FF' }}>who ship on macOS.</span><br />
              <span className="text-3xl md:text-4xl lg:text-5xl" style={{ color: '#F59E0B' }}>And the mobile users on the way.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#8BA3C7' }}>
              SlothLabs is building a growing suite of native apps — developer tools on desktop today,
              consumer mobile apps launching soon. One placement network, tens of thousands of users.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              <a
                href="mailto:hello@slothlabs.org?subject=Advertising%20Inquiry&body=Hi%2C%20I%27m%20interested%20in%20advertising%20with%20SlothLabs."
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: '#00D4FF', color: '#050818' }}
              >
                Get in touch →
              </a>
              <a
                href="https://ko-fi.com/slothlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: '#F59E0B', color: '#1a1a1a' }}
              >
                <span>☕</span> Support on Ko-fi
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 md:py-20 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: '7+',              label: 'Apps in the suite',                 accent: '#00D4FF' },
              { value: 'Desktop + Mobile', label: 'macOS today · iOS & Android soon', accent: '#F59E0B' },
              { value: 'In-app + Web',    label: 'News tab & slothlabs.org/news',     accent: '#8B5CF6' },
              { value: 'Clearly labelled', label: 'SPONSOR badge, always transparent', accent: '#10B981' },
            ].map((stat, i) => (
              <ScrollReveal key={stat.value} delay={i * 80}>
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: '#0d1124', border: '1px solid #1a2040' }}
                >
                  <p
                    className="text-xl md:text-2xl font-bold mb-1.5"
                    style={{ fontFamily: 'Syne, sans-serif', color: stat.accent }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ color: '#8BA3C7' }} className="text-sm leading-snug">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Desktop Apps ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4A6080' }}>Desktop Suite — Live</span>
              <h2
                className="text-3xl md:text-4xl font-bold text-white mt-3 mb-3"
                style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
              >
                Native macOS developer tools
              </h2>
              <p className="max-w-xl mx-auto text-sm" style={{ color: '#8BA3C7' }}>
                AWS engineers, Kubernetes operators, DynamoDB developers, and macOS power users.
                Highly technical, highly engaged.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {DESKTOP_APPS.map((app, i) => (
              <ScrollReveal key={app.name} delay={i * 60}>
                <div
                  className="rounded-xl p-5 flex items-start gap-3 group hover:-translate-y-0.5 transition-transform duration-200"
                  style={{ background: '#0d1124', border: '1px solid #1a2040' }}
                >
                  <span className="text-2xl flex-shrink-0">{app.icon}</span>
                  <div>
                    <p
                      className="font-semibold text-white text-sm mb-0.5"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {app.name}
                    </p>
                    <p className="text-xs" style={{ color: '#8BA3C7' }}>{app.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mobile Apps Coming ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F59E0B' }}>Mobile — Coming Soon</span>
              <h2
                className="text-3xl md:text-4xl font-bold text-white mt-3 mb-3"
                style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
              >
                iOS & Android apps on the way
              </h2>
              <p className="max-w-xl mx-auto text-sm" style={{ color: '#8BA3C7' }}>
                The Orbit suite is expanding to mobile. Ads placed today grow with the audience.
                Early sponsors get priority placement and locked-in rates.
              </p>
            </div>
          </ScrollReveal>
          <div className="max-w-lg mx-auto">
            {MOBILE_APPS.map((app, i) => (
              <ScrollReveal key={app.name} delay={i * 60}>
                <div
                  className="rounded-xl p-6 flex items-start gap-4"
                  style={{ background: '#0d1124', border: `1px solid ${app.accent}30` }}
                >
                  <span className="text-3xl flex-shrink-0">{app.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="font-semibold text-white text-base"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {app.name}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${app.accent}20`, color: app.accent, border: `1px solid ${app.accent}40` }}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: '#8BA3C7' }}>{app.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={100}>
            <p className="text-center mt-6 text-xs" style={{ color: '#4A6080' }}>
              More mobile apps in development — all with a shared news feed across the SlothLabs suite.
            </p>
          </ScrollReveal>
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
            <p className="text-center mb-12 max-w-xl mx-auto text-sm" style={{ color: '#8BA3C7' }}>
              Two surfaces, one unified placement. Your message appears where developers already look for updates.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <ScrollReveal delay={100}>
              <div
                className="rounded-2xl p-8 h-full flex flex-col"
                style={{ background: '#0d1124', border: '1px solid #1a2040' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    In-App News Feed
                  </h3>
                </div>
                <ul className="space-y-3 text-sm flex-1" style={{ color: '#8BA3C7' }}>
                  {[
                    'News tab in every desktop Orbit app (and mobile apps as they ship)',
                    'Title, markdown body, SPONSOR badge, CTA button',
                    'Reach all active users who open the News tab',
                    'Cached client-side — your ad loads instantly, no tracking pixels',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="flex-shrink-0 mt-0.5" style={{ color: '#00D4FF' }}>▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t" style={{ borderColor: '#1a2040' }}>
                  <p className="text-sm font-semibold" style={{ color: '#00D4FF' }}>Contact us for pricing</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div
                className="rounded-2xl p-8 h-full flex flex-col"
                style={{ background: '#0d1124', border: '1px solid #1a2040' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">🌐</span>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    Web News Feed
                  </h3>
                </div>
                <ul className="space-y-3 text-sm flex-1" style={{ color: '#8BA3C7' }}>
                  {[
                    'Appears on slothlabs.org/news alongside all app updates',
                    'Same format as in-app — consistent brand experience',
                    'Indexed by search engines, linkable, shareable',
                    'Included with every in-app placement at no extra cost',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="flex-shrink-0 mt-0.5" style={{ color: '#00D4FF' }}>▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t" style={{ borderColor: '#1a2040' }}>
                  <p className="text-sm font-semibold" style={{ color: '#10B981' }}>Included with in-app</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Ko-fi Support ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040', background: '#0d1124' }}>
        <div className="site-container text-center">
          <ScrollReveal>
            <span className="text-4xl block mb-4">☕</span>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Support SlothLabs
            </h2>
            <p className="max-w-xl mx-auto mb-8 text-sm" style={{ color: '#8BA3C7' }}>
              Every SlothLabs app is free and open source. If you find them useful — or just want to
              help fund the next one — a coffee goes a long way.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <a
              href="https://ko-fi.com/slothlabs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm transition-all hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: '#F59E0B', color: '#1a1a1a' }}
            >
              <span className="text-base">☕</span>
              Support us on Ko-fi
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Contact CTA ─── */}
      <section className="py-16 md:py-24 border-t" style={{ borderColor: '#1a2040' }}>
        <div className="site-container text-center">
          <ScrollReveal>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Let&apos;s talk
            </h2>
            <p className="max-w-xl mx-auto mb-8 text-sm" style={{ color: '#8BA3C7' }}>
              Send us your campaign details and we&apos;ll get back to you within 24 hours.
              Early sponsors get priority placement and locked-in rates before the mobile audience arrives.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:hello@slothlabs.org?subject=Advertising%20Inquiry&body=Hi%2C%20I%27m%20interested%20in%20advertising%20with%20SlothLabs."
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: '#00D4FF', color: '#050818' }}
              >
                Send advertising inquiry
              </a>
              <a
                href="https://github.com/slothlabsorg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:opacity-80"
                style={{ border: '1px solid #1a2040', color: '#8BA3C7' }}
              >
                GitHub Discussions
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-xs" style={{ color: '#4A6080' }}>
              hello@slothlabs.org — we read every email
            </p>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  )
}
