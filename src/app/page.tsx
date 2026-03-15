import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import CustomCursor from '@/components/CustomCursor'
import { LaunchBanner } from '@/components/LaunchBanner'
import HeroParallaxBg from '@/components/HeroParallaxBg'
import { slothLabsContent } from '@/config/content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.com'

export const metadata: Metadata = {
  title: 'SlothLabs — AWS client UI, k8s context UI, CloudOrbit',
  description: 'SlothLabs: AWS client UI and Kubernetes context UI. CloudOrbit — visual AWS session manager, EKS, kubeconfig. Dev tools that give you your time back.',
  openGraph: { url: SITE_URL },
  alternates: { canonical: SITE_URL },
}

const { hero, products, featureHighlight } = slothLabsContent

function ServerIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#4A6080]">
      <rect x="6" y="8" width="36" height="10" rx="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="6" y="22" width="36" height="10" rx="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="38" cy="13" r="2" fill="currentColor"/>
      <circle cx="38" cy="27" r="2" fill="currentColor"/>
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#4A6080]">
      <ellipse cx="24" cy="14" rx="14" ry="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 14v8c0 3.31 6.27 6 14 6s14-2.69 14-6v-8" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 22v8c0 3.31 6.27 6 14 6s14-2.69 14-6v-8" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

function Hero() {
  return (
    <section className="relative noise" style={{ minHeight: 'min(100vh, 720px)' }}>
      {/* Capa de fondo: overflow hidden solo aquí para no recortar la sombra del CTA */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#050d1f]" />
        <HeroParallaxBg />
        {/* Nebula glow effects */}
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

      {/* Content */}
      <div className="relative z-10 site-container flex items-center" style={{ minHeight: 'min(100vh, 720px)', paddingTop: '72px' }}>
        <div className="w-full grid grid-rows-1 md:grid-cols-2 items-start gap-10 lg:gap-14 py-[52px]">

          {/* Left: mascot — mockup: 35–40% ancho hero, muy protagonista */}
          <div className="relative flex justify-center md:justify-end order-2 md:order-1 w-fit max-w-full md:justify-self-end">
            <div className="absolute inset-0 flex items-center justify-center md:justify-end">
              <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-[#4DA6FF]/12 blur-3xl" />
            </div>
            <div
              className="hero-mascot-entrance relative z-10 flex flex-wrap w-[400px] h-[400px] max-w-[400px] bg-no-repeat bg-center select-none drop-shadow-2xl"
              style={{
                backgroundImage: 'url(/images/sloth-mascot.png)',
                backgroundSize: '100%',
                backgroundPosition: '50% 50%',
              }}
              role="img"
              aria-label="SlothLabs mascot"
            />
          </div>

          {/* Right: copy — mockup: jerarquía clara, headline muy visible */}
          <div className="min-w-0 overflow-visible space-y-6 order-1 md:order-2 text-center md:text-left">
            <h1
              className="fade-up w-fit break-words text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-[75px] font-bold leading-[1.1] text-white"
              style={{
                fontFamily: 'Syne, sans-serif',
                fontStyle: 'normal',
                fontWeight: 700,
                animationDelay: '0.1s',
              }}
            >
              {hero.headline.split('\n')[0]}
              <span className="hero-gradient-line block mt-1 font-extrabold">{hero.headline.split('\n')[1]}</span>
            </h1>

            <p
              className="fade-up text-lg text-[#8BA3C7] leading-relaxed w-[600px] max-w-full mx-auto md:mx-0"
              style={{ animationDelay: '0.2s' }}
            >
              {hero.subtitle}
            </p>

            <div className="fade-up flex flex-col sm:flex-row gap-3 justify-center md:justify-start overflow-visible min-h-[80px] items-center" style={{ animationDelay: '0.3s' }}>
              <Link
                href="/#products"
                className="inline-flex items-center justify-center gap-0 w-[175px] h-10 px-8 py-3.5 rounded-full bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all glow-cta hover:-translate-y-0.5 active:translate-y-0 mt-5 mb-5 ml-0 mr-0"
              >
                {hero.cta}
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-[#4DA6FF] text-sm hover:text-white transition-colors"
              >
                {hero.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into products section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050d1f] to-transparent pointer-events-none z-10" />
    </section>
  )
}

function Products() {
  return (
    <section id="products" className="bg-[#050d1f] py-24">
      <div className="site-container">
        <ScrollReveal className="text-center mb-14 space-y-4">
          <h2
            className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-white"
            style={{ fontFamily: 'Syne, sans-serif', fontStyle: 'normal' }}
          >
            {products.headline}
          </h2>
          <p className="text-[#8BA3C7] text-base lg:text-lg max-w-xl mx-auto">{products.sub}</p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {products.items.map((product, i) => (
            <ScrollReveal key={product.name} delay={i * 100}>
              {product.live ? (
                <div
                  className="group relative rounded-2xl p-8 bg-[#0d1b3e] border-2 border-[#00D4FF]/50 hover:border-[#00D4FF] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_32px_rgba(0,212,255,0.15)] cursor-pointer overflow-hidden h-full flex flex-col"
                  style={{ '--card-glow': 'rgba(0,212,255,0.15)' } as React.CSSProperties}
                >
                  {product.name === 'CloudOrbit' && <LaunchBanner variant="badge" />}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="mb-6 flex justify-center">
                      <div
                        className="inline-block w-full h-[180px] bg-no-repeat bg-center group-hover:scale-105 transition-transform duration-300 mt-5 mb-5"
                        style={{
                          backgroundImage: 'url(/images/cloudorbit-badge.png)',
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                        }}
                        role="img"
                        aria-label={product.name}
                      />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-[#00D4FF] mb-1 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif', fontStyle: 'normal' }}>
                      {product.name === 'CloudOrbit' && (
                        <span
                          className="w-8 h-8 flex-shrink-0 rounded-lg bg-no-repeat bg-center bg-contain opacity-90"
                          style={{
                            backgroundImage: 'url(/images/cloudorbit-icon.png)',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                          }}
                          role="img"
                          aria-hidden
                          title="CloudOrbit app icon"
                        />
                      )}
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#4A6080] mb-4">{product.by}</p>
                    <p className="text-[#8BA3C7] text-sm leading-relaxed flex-1">{product.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-4 mb-6">
                      {product.tags.map(tag => (
                        <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#112244] text-[#8BA3C7] border border-[#1a3060]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {product.cta && (
                      <Link href={product.slug!} className="inline-flex items-center text-sm font-semibold text-[#00D4FF] hover:underline mt-auto">
                        {product.cta}
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative rounded-card p-6 bg-[#0d1b3e] border border-[#1a3060] h-full flex flex-col overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                  <div className="absolute top-4 right-4">
                    <span className="badge-shimmer px-2.5 py-1 rounded-full text-xs font-medium border border-[#4DA6FF]/40 text-[#4DA6FF] bg-[#4DA6FF]/10">
                      Coming soon
                      {'comingSoonDate' in product && product.comingSoonDate ? ` · ${product.comingSoonDate}` : ''}
                    </span>
                  </div>
                  <div className="mb-6 mt-2">
                    {product.name === 'DevPanel' ? <ServerIcon /> : <DatabaseIcon />}
                  </div>
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif', fontStyle: 'normal' }}>
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#4A6080] mb-3">{product.by}</p>
                  <p className="text-[#8BA3C7] text-sm leading-relaxed flex-1">{product.desc}</p>
                  {'tags' in product && product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {product.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#112244] text-[#8BA3C7] border border-[#1a3060]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureHighlight() {
  const fh = featureHighlight
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0d1b3e] to-[#050d1f]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-[#00D4FF]/10 blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-[#4DA6FF]/10 blur-3xl" />
      </div>

      <div className="relative z-10 site-container">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <div className="space-y-6">
              <div className="mb-2">
                <LaunchBanner variant="banner" />
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-[50px] w-[50px] flex-shrink-0 rounded-lg bg-no-repeat bg-center bg-contain opacity-90"
                  style={{
                    backgroundImage: 'url(/images/cloudorbit-icon.png)',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                  }}
                  role="img"
                  aria-label="CloudOrbit"
                  title="CloudOrbit app icon"
                />
                <span
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: '#00D4FF', fontFamily: 'Syne, sans-serif', fontStyle: 'normal' }}
                >
                  {fh.eyebrow}
                </span>
              </div>

              <h2
                className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold leading-tight tracking-tight text-white"
                style={{ fontFamily: 'Syne, sans-serif', fontStyle: 'normal' }}
              >
                {fh.headline.split('\n').map((line, i) => (
                  <span key={i} className={i === 1 ? 'gradient-text block' : 'block'}>{line}</span>
                ))}
              </h2>

              <p className="text-[#8BA3C7] leading-relaxed text-base lg:text-lg">{fh.body}</p>

              <ul className="space-y-3 mt-6">
                {fh.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00D4FF]/15 flex items-center justify-center text-[#00D4FF] text-xs font-bold">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-8">
                <Link
                  href="/#products"
                  className="px-6 py-3 rounded-full border border-[#4DA6FF] text-[#4DA6FF] text-sm font-medium hover:bg-[#4DA6FF]/10 transition-all"
                >
                  {fh.cta}
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div
              className="relative w-full min-h-[420px] md:min-h-[560px] flex justify-center items-end md:items-center bg-center bg-no-repeat opacity-100"
              style={{
                backgroundImage: 'url(/images/cloudorbit-feature-bg.png)',
                backgroundSize: '110%',
                opacity: 1,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 md:w-[420px] md:h-[420px] rounded-full bg-[#00D4FF]/10 blur-3xl" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main className="bg-[#050d1f]">
      <CustomCursor />
      <Navbar />
      <Hero />
      <Products />
      <FeatureHighlight />
      <Footer />
    </main>
  )
}
