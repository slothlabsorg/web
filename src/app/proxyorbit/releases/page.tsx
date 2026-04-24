import type { Metadata } from 'next'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ReleasesPageContent from '@/components/ReleasesPageContent'
import { allReleases } from '@/data/releases'

const ACCENT = '#94A3B8'

export const metadata: Metadata = {
  title: 'ProxyOrbit Releases | SlothLabs',
  description: 'ProxyOrbit release history and changelog. Download the latest version.',
  alternates: { canonical: 'https://slothlabs.org/proxyorbit/releases' },
}

export default function ProxyOrbitReleasesPage() {
  return (
    <main style={{ background: '#070a0f', minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar icon="🔍" iconSrc="/images/proxyorbit-icon.png" name="ProxyOrbit" accent={ACCENT} />
      <ReleasesPageContent app={allReleases.proxyorbit} />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
