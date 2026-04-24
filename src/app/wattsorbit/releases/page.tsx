import type { Metadata } from 'next'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ReleasesPageContent from '@/components/ReleasesPageContent'
import { allReleases } from '@/data/releases'

const ACCENT = '#F59E0B'

export const metadata: Metadata = {
  title: 'WattsOrbit Releases | SlothLabs',
  description: 'WattsOrbit release history and changelog. Download the latest version of WattsOrbit for macOS.',
  alternates: { canonical: 'https://slothlabs.org/wattsorbit/releases' },
}

export default function WattsOrbitReleasesPage() {
  return (
    <main style={{ background: '#0c0900', minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar icon="⚡" iconSrc="/images/wattsorbit-icon.png" name="WattsOrbit" accent={ACCENT} />
      <ReleasesPageContent app={allReleases.wattsorbit} />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
