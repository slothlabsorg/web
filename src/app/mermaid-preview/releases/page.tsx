import type { Metadata } from 'next'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ReleasesPageContent from '@/components/ReleasesPageContent'
import { allReleases } from '@/data/releases'

const ACCENT = '#FF3670'

export const metadata: Metadata = {
  title: 'Mermaid Preview Releases | SlothLabs',
  description: 'Mermaid Preview release history and changelog. Download the latest version of the JetBrains IDE plugin.',
  alternates: { canonical: 'https://slothlabs.org/mermaid-preview/releases' },
}

export default function MermaidPreviewReleasesPage() {
  return (
    <main style={{ background: '#0a0308', minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar icon="🧜" name="Mermaid Preview" accent={ACCENT} />
      <ReleasesPageContent app={allReleases['mermaid-preview']} />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
