import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import PricingSupportCTA from '@/components/PricingSupportCTA'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'About — SlothLabs',
  description: 'We are SlothLabs. We build dev tools that give you your time back — CloudOrbit, DataOrbit and more. By devs, for devs.',
  keywords: ['SlothLabs', 'about', 'dev tools', 'CloudOrbit', 'DataOrbit'],
  openGraph: {
    title: 'About SlothLabs',
    description: 'We build dev tools that give you your time back. By devs, for devs.',
    url: `${SITE_URL}/about`,
    siteName: 'SlothLabs',
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/about` },
}

export default function AboutPage() {
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
          <div className="flex flex-col md:flex-row items-start gap-10 md:gap-16">
            {/* Slothy intro card */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3 text-center w-44 md:w-52 mt-2">
              <div className="relative w-44 h-44 md:w-52 md:h-52">
                <div className="absolute inset-0 rounded-full bg-[#4DA6FF]/10 blur-2xl" />
                <Image
                  src="/images/imslothy.png"
                  alt="Hi, I'm Slothy — the SlothLabs mascot"
                  width={208}
                  height={208}
                  className="relative z-10 drop-shadow-2xl select-none"
                />
              </div>
              <p className="text-sm font-semibold text-white">Hi, I&apos;m Slothy.</p>
              <p className="text-xs text-[#4A6080] leading-relaxed">
                The spirit of SlothLabs — slow, deliberate, and completely unbothered by deadlines.
              </p>
              <div className="mt-1 relative w-20 h-20">
                <Image
                  src="/images/crabslothy.png"
                  alt="Slothy as a crab — in a pinch but still shipping"
                  width={80}
                  height={80}
                  className="relative z-10 drop-shadow-xl select-none opacity-80"
                />
                <p className="text-[10px] text-[#4A6080] mt-1">shipping anyway 🦀</p>
              </div>
            </div>

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
              We’re devs too.
              <br />
              <span className="gradient-text">We build what we wished we had.</span>
            </h1>
            <p className="text-lg text-[#8BA3C7] leading-relaxed">
              SlothLabs started from a simple frustration: too much of our day was spent on tooling that slowed us down — 
              copying credentials, context-switching, fighting configs. Then came the nights staring at DynamoDB docs, 
              not knowing which command actually fits what you need; CouchDB replication blowing up in the terminal with errors that don't tell you why; time-series DBs where the CLI feels like an afterthought and every query is a guess. Those managed DBs that feel like nobody’s really 
              maintaining them. And Kubernetes — the YAML, the context switches, the “it worked on my cluster.” We got 
              tired of losing hours to the same friction. We’re devs too. We wanted tools that give time back and feel 
              like a teammate, not another thing to maintain. So we’re building them: for us, and for every dev out there 
              who's ever stared at a red terminal at 2am and thought there has to be a better way. That’s the mission.
            </p>
            </div>{/* /max-w-3xl */}
          </div>{/* /flex row */}
        </div>{/* /site-container */}
      </section>

      <section className="py-16 md:py-24 border-t border-[#1a3060]">
        <div className="site-container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-6"
                style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
              >
                Helping others save time and ship
              </h2>
              <p className="text-[#8BA3C7] leading-relaxed mb-4">
                Time lost to that friction — whether it’s a session that died mid-debug, configs that won’t line up, or yet another CLI that doesn’t quite fit — 
                is time not spent building what matters. We build for developers who want to focus 
                on their product, not the plumbing.
              </p>
              <p className="text-[#8BA3C7] leading-relaxed">
                Our tools are built to work the way you do: fast, transparent, and without locking you into
                yet another platform. We’re here to make AWS, Kubernetes, and the rest of the stack a little more 
                human — one sloth step at a time.
              </p>
            </div>
            <div className="rounded-2xl p-8 bg-[#0d1b3e] border border-[#1a3060]">
              <p className="text-[#8BA3C7] leading-relaxed italic">
                “We build the tools we wished we had at 2am — digging through notes for the right command, or when a session expired right in the middle of a debug. 
                If it helps one other dev get home earlier, it’s worth it.”
              </p>
              <p className="text-sm text-[#4A6080] mt-4">— The SlothLabs team</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-[#1a3060]">
        <div className="site-container text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-4"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            Want to say hi?
          </h2>
          <p className="text-[#8BA3C7] mb-8 max-w-xl mx-auto">
            We’re always happy to hear from fellow devs — whether it’s feedback, a bug, or just to chat about building better tools.
          </p>
          <Link
            href="mailto:friends@slothlabs.org"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#4DA6FF] text-[#050d1f] font-semibold text-sm hover:brightness-110 transition-all"
          >
            friends@slothlabs.org
          </Link>
        </div>
      </section>

      <PricingSupportCTA />

      <Footer />
    </main>
  )
}
