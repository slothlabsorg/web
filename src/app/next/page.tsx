import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import StarField from '@/components/StarField'
import NextBigReleaseHero from '@/components/NextBigReleaseHero'
import { UPCOMING_LAUNCHES, nextUpcomingLaunch, launchTsUtcNoon } from '@/data/upcomingLaunches'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'Next Big Release — SlothLabs',
  description: 'The next SlothLabs app shipping next, with a live countdown and a shareable permalink for every upcoming launch.',
  openGraph: {
    url: `${SITE_URL}/next/`,
    title: 'Next Big Release — SlothLabs',
    description: 'Live countdown to the next SlothLabs launch. Shareable permalinks for every upcoming app.',
    siteName: 'SlothLabs',
    images: [{ url: `${SITE_URL}/images/slothlabs-hero.png`, width: 1200, height: 630, alt: 'SlothLabs — next big release' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next Big Release — SlothLabs',
    description: 'Live countdown to the next SlothLabs launch.',
    images: [`${SITE_URL}/images/slothlabs-hero.png`],
  },
  alternates: { canonical: `${SITE_URL}/next/` },
}

export default function NextIndexPage() {
  const next = nextUpcomingLaunch()
  const NOW = Date.now()

  // Decorate + sort: dated future ascending, then TBD entries.
  const decorated = UPCOMING_LAUNCHES.map(l => {
    const ts = launchTsUtcNoon(l.launchDate)
    const isFuture = ts !== null && ts >= NOW
    return { l, ts, isFuture }
  })
  const dated = decorated.filter(d => d.ts !== null).sort((a, b) => (a.ts as number) - (b.ts as number))
  const tbd = decorated.filter(d => d.ts === null)
  const ordered = [...dated, ...tbd]

  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <StarField />
      <Navbar />

      <NextBigReleaseHero launch={next} permalink={`/next/${next.slug}/`} variant="home" />

      <section className="relative py-20">
        <div className="site-container">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Every upcoming launch</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Pick a launch to share
            </h2>
            <p className="text-[#8BA3C7] max-w-xl mx-auto">
              Each app has its own permalink. Send it to a teammate or post it — the page renders the same countdown and copy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ordered.map(({ l, ts, isFuture }) => (
              <Link
                key={l.slug}
                href={`/next/${l.slug}/`}
                className="block group rounded-2xl border p-6 transition-all hover:-translate-y-0.5"
                style={{ borderColor: `${l.accent}30`, background: `${l.accent}08` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ borderColor: `${l.accent}80`, background: '#0a1424' }}
                  >
                    {l.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{l.appName}</h3>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                        style={{ color: l.accent, borderColor: `${l.accent}60`, background: `${l.accent}15` }}
                      >
                        {ts === null ? 'TBD' : isFuture ? 'Upcoming' : 'Live'}
                      </span>
                    </div>
                    <p className="text-sm text-[#8BA3C7] mt-1">{l.dateLabel}</p>
                    <p className="text-sm text-[#8BA3C7] mt-2 line-clamp-2">{l.headline}</p>
                    <span className="inline-block mt-3 text-xs font-semibold transition-colors" style={{ color: l.accent }}>
                      Open permalink →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
