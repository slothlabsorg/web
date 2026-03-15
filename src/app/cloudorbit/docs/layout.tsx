import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.com'

export const metadata: Metadata = {
  title: 'CloudOrbit Docs — Install, AWS setup, troubleshooting | SlothLabs',
  description:
    'CloudOrbit documentation: installation (macOS, Homebrew), AWS SSO setup, quick start, troubleshooting Cloudflare. AWS client UI and k8s context UI by SlothLabs.',
  keywords: [
    'CloudOrbit docs',
    'CloudOrbit installation',
    'AWS client UI',
    'k8s context',
    'EKS kubeconfig',
    'SlothLabs',
  ],
  openGraph: {
    title: 'CloudOrbit Docs | SlothLabs',
    description: 'Install CloudOrbit, AWS setup, quick start, Cloudflare troubleshooting. AWS client UI by SlothLabs.',
    url: `${SITE_URL}/cloudorbit/docs`,
    siteName: 'SlothLabs',
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/cloudorbit/docs` },
}

export default function CloudOrbitDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
