import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import PricingSupportCTA from '@/components/PricingSupportCTA'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'Pricing — SlothLabs',
  description: 'SlothLabs tools are free and open source. Developer-first pricing. Future Pro tiers only where we have ongoing costs.',
  keywords: ['SlothLabs', 'pricing', 'free', 'open source', 'CloudOrbit', 'DataOrbit'],
  openGraph: {
    title: 'Pricing | SlothLabs',
    description: 'Our dev tools are free and open source. Developer-first pricing.',
    url: `${SITE_URL}/pricing`,
    siteName: 'SlothLabs',
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/pricing` },
}

export default function PricingPage() {
  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <Navbar />
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4DA6FF]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00D4FF]/8 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 site-container">
          <div className="max-w-3xl">
            <div
              className="h-[50px] w-32 bg-no-repeat bg-left bg-contain opacity-95 mb-8"
              style={{ backgroundImage: 'url(/images/slothlabs-logo-nav.png)' }}
              role="img"
              aria-label="SlothLabs"
            />
            <h1
              className="text-4xl md:text-5xl lg:text-[3rem] font-bold leading-[1.1] text-white mb-6"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Free first.
              <br />
              <span className="gradient-text">Sustainable later.</span>
            </h1>
            <p className="text-lg text-[#8BA3C7] leading-relaxed">
              We believe the best dev tools should be available to everyone. Our core products are free and open source — and we intend to keep it that way for everything that doesn’t create a direct, ongoing cost for us. No AI token metering, no usage-based fees that would force us to pass costs on to you. Just solid tools that respect your time and your stack.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-[#1a3060]">
        <div className="site-container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-6"
                style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
              >
                What stays free
              </h2>
              <p className="text-[#8BA3C7] leading-relaxed mb-4">
                Session management, account switching, EKS discovery, kubeconfig updates — the kind of features that don’t rely on external APIs or per-request costs — will remain free and open source. We maintain them because we use them ourselves, and we want the community to have the same power without a paywall.
              </p>
              <p className="text-[#8BA3C7] leading-relaxed">
                We’re open-source advocates. Our code is there for you to read, fork, and contribute to. We build in the open and we listen to developers. That won’t change.
              </p>
            </div>
            <div className="rounded-2xl p-8 bg-[#0d1b3e] border border-[#1a3060]">
              <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
                Future Pro tiers
              </h3>
              <p className="text-[#8BA3C7] leading-relaxed">
                If we add features that depend on AI, dedicated cloud infrastructure, or other recurring costs, we may introduce optional Pro plans with a moderate price — enough to cover those costs and keep the lights on, not to lock you into a platform. We’d rather stay small and useful than scale into something that forgets who it’s built for.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-[#1a3060]">
        <div className="site-container">
          <div className="max-w-3xl">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-6"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Built from the heart, in our free time
            </h2>
            <p className="text-[#8BA3C7] leading-relaxed mb-4">
              SlothLabs is not backed by any company or fund. We’re developers who got tired of the same friction and decided to fix it — nights and weekends, because we care about the craft and the community. No formal support, no big team; just people who want to give other devs better tools.
            </p>
            <p className="text-[#8BA3C7] leading-relaxed">
              If that resonates with you, we’d love to hear from you. And if you find our work useful, supporting us helps us keep improving and shipping for everyone.
            </p>
          </div>
        </div>
      </section>

      <PricingSupportCTA />

      <Footer />
    </main>
  )
}
