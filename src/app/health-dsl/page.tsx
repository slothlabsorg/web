import type { Metadata } from 'next'
import LibraryShowcase from '@/components/LibraryShowcase'
import { LIBRARIES } from '@/data/libraries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const lib = LIBRARIES['health-dsl']

export const metadata: Metadata = {
  title: `${lib.name} — readiness/liveness health-check DSL | SlothLabs`,
  description: lib.description,
  keywords: lib.keywords,
  openGraph: {
    title: `${lib.name} — declare service health checks, run concurrently, aggregate correctly`,
    description: lib.tagline,
    url: `${SITE_URL}/${lib.slug}`,
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/${lib.slug}` },
  twitter: {
    card: 'summary_large_image',
    title: `${lib.name} — health checks, declared not improvised`,
    description: lib.tagline,
  },
}

export default function HealthDslPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: lib.name,
    description: lib.description,
    url: `${SITE_URL}/${lib.slug}`,
    codeRepository: `https://github.com/slothlabsorg/${lib.repo}`,
    programmingLanguage: ['Rust', 'TypeScript', 'Kotlin'],
    applicationCategory: 'DeveloperApplication',
    author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
    license: 'https://opensource.org/licenses/MIT',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LibraryShowcase library={lib} />
    </>
  )
}
