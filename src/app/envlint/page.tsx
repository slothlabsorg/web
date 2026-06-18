import type { Metadata } from 'next'
import LibraryShowcase from '@/components/LibraryShowcase'
import { LIBRARIES } from '@/data/libraries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const lib = LIBRARIES['envlint']

export const metadata: Metadata = {
  title: `${lib.name} — schema-driven .env & environment validation | SlothLabs`,
  description: lib.description,
  keywords: lib.keywords,
  openGraph: {
    title: `${lib.name} — environment variable validation, three native implementations`,
    description: lib.tagline,
    url: `${SITE_URL}/${lib.slug}`,
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/${lib.slug}` },
  twitter: {
    card: 'summary_large_image',
    title: `${lib.name} — catch bad config before it ships`,
    description: lib.tagline,
  },
}

export default function EnvlintPage() {
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
