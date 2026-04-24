import type { Metadata } from 'next'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ReleasesPageContent from '@/components/ReleasesPageContent'
import { allReleases } from '@/data/releases'

const ACCENT = '#8B5CF6'

export const metadata: Metadata = {
  title: 'DataOrbit Releases | SlothLabs',
  description: 'DataOrbit release history and changelog. Download the latest version.',
  alternates: { canonical: 'https://slothlabs.org/dataorbit/releases' },
}

export default function DataOrbitReleasesPage() {
  return (
    <main style={{ background: '#060614', minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar icon="🗄️" iconSrc="/images/dataorbit-icon.png" name="DataOrbit" accent={ACCENT} />
      <ReleasesPageContent app={allReleases.dataorbit} />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
