import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.com'

export const metadata: Metadata = {
  title: 'CloudOrbit Docs — Install, AWS setup, troubleshooting | SlothLabs',
  description:
    'CloudOrbit documentation: installation (macOS, Homebrew), AWS SSO setup, quick start, Cloudflare troubleshooting. Cloud session manager — AWS now, GCP and Azure coming.',
  keywords: [
    'CloudOrbit docs',
    'CloudOrbit installation',
    'cloud session manager',
    'AWS setup',
    'AWS SSO',
    'k8s context',
    'EKS kubeconfig',
    'Cloudflare',
    'SlothLabs',
  ],
  openGraph: {
    title: 'CloudOrbit Docs — Install & setup | SlothLabs',
    description: 'CloudOrbit docs: installation, AWS setup, quick start, Cloudflare troubleshooting. Cloud session manager.',
    url: `${SITE_URL}/cloudorbit/docs`,
    siteName: 'SlothLabs',
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/cloudorbit/docs` },
}

export default function CloudOrbitDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
