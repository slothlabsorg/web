import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SlothLabs — Dev tools that give you your time back',
    template: '%s | SlothLabs',
  },
  description:
    'Dev tools for devs and DevOps that boost performance and save time. AWS client, session manager, EKS kubeconfig — so you can focus on what matters.',
  keywords: [
    'AWS',
    'AWS client',
    'DevOps',
    'GUI',
    'CloudOrbit',
    'EKS',
    'kubeconfig',
    'session manager',
    'AWS session manager',
    'Leapp alternative',
  ],
  openGraph: {
    title: 'SlothLabs — Dev tools that give you your time back',
    description: 'AWS session manager, EKS, kubeconfig. Dev tools that give you your time back so you can focus on what matters.',
    siteName: 'SlothLabs',
    type: 'website',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlothLabs — Dev tools that give you your time back',
    description: 'AWS session manager, EKS, kubeconfig. Get your time back. Ship faster.',
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
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/slothlabs-logo-light.png` },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'SlothLabs',
      publisher: { '@id': `${SITE_URL}/#organization` },
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
