import type { Metadata } from 'next'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ReleasesPageContent from '@/components/ReleasesPageContent'
import { allReleases } from '@/data/releases'

const ACCENT = '#10B981'

export const metadata: Metadata = {
  title: 'BastionOrbit Releases | SlothLabs',
  description: 'BastionOrbit release history and changelog. Download the latest version.',
  alternates: { canonical: 'https://slothlabs.org/bastionorbit/releases' },
}

export default function BastionOrbitReleasesPage() {
  return (
    <main style={{ background: '#030d09', minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar icon="🔐" iconSrc="/images/bastionorbit-icon.png" name="BastionOrbit" accent={ACCENT} />
      <ReleasesPageContent app={allReleases.bastionorbit} />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
