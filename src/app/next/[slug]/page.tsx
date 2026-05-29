import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import StarField from '@/components/StarField'
import NextBigReleaseHero from '@/components/NextBigReleaseHero'
import { UPCOMING_LAUNCHES, findLaunch } from '@/data/upcomingLaunches'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export function generateStaticParams() {
  return UPCOMING_LAUNCHES.map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const launch = findLaunch(params.slug)
  if (!launch) {
    return { title: 'Launch not found — SlothLabs' }
  }
  const url = `${SITE_URL}/next/${launch.slug}/`
  const title = `${launch.appName} drops ${launch.dateLabel} — SlothLabs`
  const description = launch.pitch
  return {
    title,
    description,
    openGraph: {
      url,
      title,
      description,
      siteName: 'SlothLabs',
      images: [{ url: `${SITE_URL}${launch.previewImage}`, width: 1200, height: 800, alt: `${launch.appName} preview` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}${launch.previewImage}`],
    },
    alternates: { canonical: url },
  }
}

export default function NextLaunchPermalink({ params }: { params: { slug: string } }) {
  const launch = findLaunch(params.slug)
  if (!launch) notFound()

  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <StarField />
      <Navbar />

      <NextBigReleaseHero launch={launch} permalink={`/next/${launch.slug}/`} variant="permalink" />

      <section className="py-12">
        <div className="site-container text-center">
          <Link href="/next/" className="inline-flex items-center gap-2 text-sm text-[#8BA3C7] hover:text-white transition-colors">
            ← All upcoming launches
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
