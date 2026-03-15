import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SlothLabs — AWS client UI, Kubernetes context UI, dev tools',
    template: '%s | SlothLabs',
  },
  description:
    'SlothLabs builds AWS client UI and Kubernetes (k8s) context UI tools. CloudOrbit: visual AWS session manager, EKS kubeconfig, switch accounts without terminal. Dev tools that give you your time back.',
  keywords: [
    'SlothLabs',
    'AWS client UI',
    'AWS client',
    'UI k8s context',
    'Kubernetes context UI',
    'k8s context',
    'EKS UI',
    'AWS GUI',
    'AWS session manager',
    'CloudOrbit',
    'EKS',
    'kubeconfig',
    'Leapp alternative',
    'DevOps',
    'visual AWS',
  ],
  openGraph: {
    title: 'SlothLabs — AWS client UI, k8s context UI, CloudOrbit',
    description: 'AWS client UI and Kubernetes context UI. CloudOrbit: visual AWS session manager, EKS, kubeconfig. SlothLabs dev tools — no terminal needed.',
    siteName: 'SlothLabs',
    type: 'website',
    url: SITE_URL,
    images: [{ url: '/images/slothlabs-hero.png', width: 1200, height: 630, alt: 'SlothLabs — Dev tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlothLabs — AWS client UI, k8s context UI',
    description: 'CloudOrbit: visual AWS session manager, EKS, kubeconfig. SlothLabs dev tools.',
  },
  alternates: { canonical: SITE_URL },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'SlothLabs',
      url: SITE_URL,
      description: 'SlothLabs builds AWS client UI and Kubernetes context UI tools. CloudOrbit: visual AWS session manager, EKS kubeconfig.',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/slothlabs-logo-light.png` },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'SlothLabs',
      description: 'AWS client UI, UI k8s context, CloudOrbit — SlothLabs dev tools.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/cloudorbit?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
