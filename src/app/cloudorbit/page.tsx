import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import CloudOrbitNavbar from '@/components/CloudOrbitNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import DownloadModal from '@/components/DownloadModal'
import { LaunchBanner } from '@/components/LaunchBanner'
import { cloudOrbitContent, slothLabsContent } from '@/config/content'

const WAITLIST_FORM_URL = 'https://form.jotform.com/260731775592061'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.com'

const { hero, features, comparison } = cloudOrbitContent
const { problem, whyRust, plugins, screenshots, downloadCta } = slothLabsContent

export const metadata: Metadata = {
  title: 'CloudOrbit — Cloud session manager (AWS, GCP, Azure) | SlothLabs',
  description:
    'CloudOrbit: visual cloud session manager. AWS today — switch accounts, EKS, kubeconfig auto-update. GCP and Azure coming. No terminal. Works behind Cloudflare. By SlothLabs.',
  keywords: [
    'CloudOrbit',
    'cloud session manager',
    'AWS session manager',
    'AWS client UI',
    'AWS client',
    'UI k8s context',
    'Kubernetes context UI',
    'k8s context UI',
    'EKS UI',
    'AWS GUI',
    'EKS',
    'kubeconfig',
    'GCP',
    'Azure',
    'Cloudflare',
    'Leapp alternative',
    'AWS SSO',
    'visual AWS',
    'SlothLabs',
  ],
  openGraph: {
    title: 'CloudOrbit — Cloud session manager (AWS, GCP, Azure) | SlothLabs',
    description: 'Visual cloud session manager. AWS now, GCP and Azure coming. EKS, kubeconfig, no terminal. Cloudflare compatible.',
    url: `${SITE_URL}/cloudorbit`,
    siteName: 'SlothLabs',
    type: 'website',
    images: [{ url: '/images/cloudorbit-hero.png', width: 1200, height: 630, alt: 'CloudOrbit — Cloud session manager by SlothLabs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CloudOrbit — Cloud session manager (AWS, GCP, Azure) | SlothLabs',
    description: 'Visual cloud session manager. AWS now, GCP and Azure coming. EKS, kubeconfig. SlothLabs.',
  },
  alternates: { canonical: `${SITE_URL}/cloudorbit` },
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center noise overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/starfield-bg.png" alt="" fill priority className="object-cover object-center" />
        {/* Teal tinted overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050d1fF2] 55% to-[#051a1f99]" />
        {/* Dark layer so logo/badge reads better */}
        <div className="absolute inset-0 bg-[#000013]/50" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#050d1f] to-transparent" />
        {/* Teal glow top-right */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4FF]/8 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
      </div>

      <StarField count={80} />

      <div className="relative z-10 site-container w-full flex items-center" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>
        <div className="w-full grid md:grid-cols-2 gap-10 lg:gap-14 xl:gap-12 2xl:gap-10 items-center py-[52px]">
          {/* Left */}
          <div className="space-y-6 max-w-full sm:max-w-xl 2xl:max-w-2xl">
            <div className="fade-up" style={{ animationDelay: '0s' }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#0d1b3e] border border-[#00D4FF]/40 text-[#00D4FF]">
                {hero.badge}
              </span>
            </div>

            <h1
              className="fade-up w-fit break-words text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-[75px] 2xl:text-[80px] font-bold leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', animationDelay: '0.1s' }}
            >
              {hero.headline.split('\n').map((line, i) => (
                <span key={i} className={i === 1 ? 'shimmer-text block' : 'block text-white'}>{line}</span>
              ))}
            </h1>

            <p className="fade-up text-lg xl:text-xl text-[#8BA3C7] leading-relaxed max-w-lg xl:max-w-xl" style={{ animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.3s' }}>
              <DownloadModal
                launchingSoon
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-btn bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all glow-cta hover:-translate-y-0.5"
              />
              <a
                href={WAITLIST_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-btn border border-[#00D4FF] text-[#00D4FF] text-sm font-medium hover:bg-[#00D4FF]/10 transition-all"
              >
                {hero.ctaSecondary}
              </a>
            </div>

            <p className="fade-up text-xs text-[#4A6080]" style={{ animationDelay: '0.35s' }}>
              {hero.note}
            </p>
            <div className="fade-up mt-1" style={{ animationDelay: '0.4s' }}>
              <LaunchBanner variant="subtle" />
            </div>
          </div>

          {/* Right — same strategy as landing: background image (transparent PNG) */}
          <div className="relative flex justify-center md:justify-end min-h-[280px] sm:min-h-[320px] md:min-h-[420px] lg:min-h-[480px] xl:min-h-[520px] overflow-hidden">
            <div className="absolute inset-0 bg-transparent">
              <div className="absolute inset-0 rounded-full bg-[#00D4FF]/12" style={{ width: '100%', height: '100%', filter: 'none' }} />
            </div>
            <div
              className="relative z-10 w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-full aspect-square max-h-[320px] sm:max-h-[380px] md:max-h-[420px] lg:max-h-[480px] xl:max-h-[520px] 2xl:max-h-[560px] bg-contain 2xl:bg-cover bg-center bg-no-repeat bg-transparent opacity-100"
              style={{
                backgroundImage: 'url(/images/cloudorbit-hero-badge.png)',
                backgroundColor: 'transparent',
              }}
              role="img"
              aria-label="CloudOrbit"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features Grid ─────────────────────────────────────────────────────────────
function Features() {
  return (
    <section className="py-28 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            {features.headline.split('\n').map((line, i) => (
              <span key={i} className={i === 1 ? 'gradient-text block' : 'block'}>{line}</span>
            ))}
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {features.items.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 80}>
              <div className="group rounded-card p-6 bg-[#0d1b3e] border border-[#1a3060] hover:border-[#00D4FF]/50 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden h-full">
                {/* Hover inner glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-card" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30">
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

// ── Comparison Table ──────────────────────────────────────────────────────────
function Comparison() {
  const iconClass = (val: string) => {
    if (val === '✅') return 'text-[#00D4FF]'
    if (val === '❌') return 'text-red-400'
    if (val === '⚠️') return 'text-yellow-400'
    return 'text-[#8BA3C7] text-xs'
  }

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/50 to-[#050d1f]" />

      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            {comparison.headline}
          </h2>
          <p className="text-[#8BA3C7] text-lg">{comparison.sub}</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border border-[#1a3060]">
            {/* Header */}
            <div className="grid grid-cols-3 bg-[#0d1b3e]">
              <div className="px-6 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider">Feature</div>
              <div className="px-6 py-4 text-xs font-semibold text-[#00D4FF] uppercase tracking-wider text-center cloudorbit-col border-x border-[#1a3060]">
                CloudOrbit
              </div>
              <div className="px-6 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center">Leapp</div>
            </div>

            {/* Rows */}
            {comparison.rows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-[#071020]' : 'bg-[#050d1f]'} border-t border-[#1a3060]`}
              >
                <div className="px-6 py-4 text-sm text-[#8BA3C7]">{row.feature}</div>
                <div className={`px-6 py-4 text-center text-sm font-medium cloudorbit-col border-x border-[#1a3060] ${iconClass(row.cloudorbit)}`}>
                  {row.cloudorbit}
                </div>
                <div className={`px-6 py-4 text-center text-sm ${iconClass(row.leapp)}`}>
                  {row.leapp}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Problem ───────────────────────────────────────────────────────────────────
function ProblemSection() {
  return (
    <section className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal>
          <div className="rounded-2xl p-8 md:p-10 bg-[#0d1b3e] border border-[#1a3060] flex flex-col md:flex-row gap-8 items-start">
            <div className="text-4xl flex-shrink-0">😤</div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                {problem.title}
              </h3>
              <p className="text-[#8BA3C7] leading-relaxed">{problem.body1}</p>
              <p className="text-[#8BA3C7] leading-relaxed">{problem.body2}</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Why Rust ──────────────────────────────────────────────────────────────────
function WhyRustSection() {
  return (
    <section className="py-24 relative overflow-x-hidden overflow-y-visible">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/30 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center min-w-0">
          <ScrollReveal className="space-y-6 min-w-0">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#00D4FF]">{whyRust.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {whyRust.headline.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h2>
            <p className="text-[#8BA3C7] leading-relaxed">{whyRust.body}</p>
            <div className="flex flex-wrap items-center gap-4 py-4">
              {whyRust.stats.map((stat, i) => (
                <span key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#00D4FF]">{stat.value}</span>
                  <span className="text-sm text-[#4A6080]">{stat.label}</span>
                  {i < whyRust.stats.length - 1 && <span className="w-px h-6 bg-[#1a3060] mx-1" aria-hidden />}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {whyRust.pills.map(pill => (
                <span key={pill} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#112244] text-[#8BA3C7] border border-[#1a3060]">
                  {pill}
                </span>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100} className="min-w-0 max-w-full">
            <div className="rounded-xl border border-[#1a3060] overflow-hidden bg-[#0a1628] min-w-0 max-w-full">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-[#4A6080] font-mono ml-2">credentials.rs</span>
              </div>
              <pre className="p-5 text-sm font-mono text-[#c9d1d9] leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-[#8BA3C7]">// Credentials own their data — the compiler</span>{'\n'}
                  <span className="text-[#8BA3C7]">// guarantees they can&apos;t outlive the session.</span>{'\n'}
                  <span className="text-[#c678dd]">#[derive</span>(Serialize)<span className="text-[#c678dd]">]</span>{'\n'}
                  <span className="text-[#c678dd]">pub struct</span> <span className="text-[#e5c07b]">Credentials</span> {'{\n'}
                  {'    '}<span className="text-[#c678dd]">pub</span> access_key_id:     <span className="text-[#e5c07b]">String</span>,{'\n'}
                  {'    '}<span className="text-[#c678dd]">pub</span> secret_access_key: <span className="text-[#e5c07b]">String</span>,{'\n'}
                  {'    '}<span className="text-[#c678dd]">pub</span> session_token:     <span className="text-[#e5c07b]">String</span>,{'\n'}
                  {'    '}<span className="text-[#c678dd]">pub</span> expires_at: <span className="text-[#e5c07b]">Option</span>&lt;<span className="text-[#e5c07b]">String</span>&gt;,{'\n'}
                  {'}\n\n'}
                  <span className="text-[#8BA3C7]">// ? propagates errors — no try/catch,</span>{'\n'}
                  <span className="text-[#8BA3C7]">// no uncaught exceptions, no silent failures.</span>{'\n'}
                  <span className="text-[#c678dd]">pub async fn</span> <span className="text-[#61afef]">assume_role</span>(…) <span className="text-[#c678dd]">-&gt;</span> <span className="text-[#e5c07b]">Result</span>&lt;<span className="text-[#e5c07b]">Credentials</span>, <span className="text-[#e5c07b]">String</span>&gt; {'{\n'}
                  {'    '}<span className="text-[#c678dd]">let</span> token = read_cached_token(&amp;start_url){'\n'}
                  {'        .ok_or('}<span className="text-[#98c379]">&quot;Not logged in&quot;</span>)<span className="text-[#56b6c2]">?</span>;{'\n'}
                  {'    '}<span className="text-[#c678dd]">let</span> resp  = sso.get_role_credentials(){'\n'}
                  {'        .send().await\n'}
                  {'        .map_err(|e| e.to_string())'}<span className="text-[#56b6c2]">?</span>;{'\n'}
                  {'    '}<span className="text-[#e5c07b]">Ok</span>(<span className="text-[#e5c07b]">Credentials</span> {'{ … }'}){'\n'}
                  {'}'}
                </code>
              </pre>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── Plugins (Roadmap) ─────────────────────────────────────────────────────────
function PluginsSection() {
  return (
    <section id="plugins" className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal className="text-center mb-12 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">{plugins.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{plugins.headline}</h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">{plugins.sub}</p>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plugins.cards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 80}>
              <div className="rounded-xl p-6 bg-[#0d1b3e] border border-[#1a3060] h-full flex flex-col">
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{card.title}</h3>
                <p className="text-sm text-[#8BA3C7] leading-relaxed flex-1">{card.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={150}>
          <div className="rounded-xl border border-[#1a3060] overflow-hidden bg-[#0a1628]">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-[#4A6080] font-mono ml-2">~/.config/cloudorbit/plugins.toml</span>
            </div>
            <pre className="p-5 text-sm font-mono text-[#c9d1d9] leading-relaxed overflow-x-auto">
              <code>
                <span className="text-[#8BA3C7]"># Notify Slack when a role is assumed</span>{'\n'}
                [<span className="text-[#e5c07b]">[plugin]</span>]{'\n'}
                name    = <span className="text-[#98c379]">&quot;slack-notify&quot;</span>{'\n'}
                type    = <span className="text-[#98c379]">&quot;hook&quot;</span>{'\n'}
                on      = <span className="text-[#98c379]">&quot;post-assume-role&quot;</span>{'\n'}
                command = <span className="text-[#98c379]">&quot;~/.cloudorbit/slack.sh&quot;</span>{'\n'}
                args    = [<span className="text-[#98c379]">&quot;--channel&quot;</span>, <span className="text-[#98c379]">&quot;#aws-access&quot;</span>]
              </code>
            </pre>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Screenshots placeholder ───────────────────────────────────────────────────
function ScreenshotsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/20 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-12 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">{screenshots.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{screenshots.headline}</h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">{screenshots.sub}</p>
        </ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {screenshots.placeholders.map((label, i) => (
            <ScrollReveal key={label} delay={i * 60}>
              <div className="aspect-video rounded-xl border border-[#1a3060] bg-[#0d1b3e] flex items-center justify-center p-4">
                <span className="text-sm text-[#4A6080] text-center">{label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Download CTA ─────────────────────────────────────────────────────────────
function DownloadCtaSection() {
  return (
    <section className="py-24 bg-[#0d1b3e] border-y border-[#1a3060]">
      <div className="site-container text-center space-y-8">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{downloadCta.headline}</h2>
          <p className="text-[#8BA3C7] text-lg mt-2">{downloadCta.sub}</p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <DownloadModal launchingSoon className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all glow-cta hover:-translate-y-0.5" />
            <Link href="https://github.com/slothlabs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-[#00D4FF] text-[#00D4FF] text-sm font-medium hover:bg-[#00D4FF]/10 transition-all">
              {downloadCta.secondary}
            </Link>
          </div>
          <p className="text-xs text-[#4A6080] mt-4">{downloadCta.note}</p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// JSON-LD for product page SEO (SoftwareApplication)
const cloudOrbitJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CloudOrbit',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Windows, Linux',
  description: 'Visual cloud session manager. AWS today, GCP and Azure coming. Switch accounts, EKS, kubeconfig auto-update. Works behind Cloudflare. By SlothLabs.',
  url: `${SITE_URL}/cloudorbit`,
  author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: ['AWS account switching', 'Session management', 'EKS cluster detection', 'kubeconfig auto-update', 'Cloudflare compatible', 'GCP and Azure coming'],
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CloudOrbitPage() {
  return (
    <main className="bg-[#050d1f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cloudOrbitJsonLd) }} />
      <CustomCursor />
      <CloudOrbitNavbar />
      <Hero />
      <Features />
      <Comparison />
      <ProblemSection />
      <WhyRustSection />
      <PluginsSection />
      <ScreenshotsSection />
      <DownloadCtaSection />
      <Footer showSuiteLink accent="#00D4FF" />
    </main>
  )
}
