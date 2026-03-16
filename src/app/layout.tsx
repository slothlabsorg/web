import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SlothLabs — Dev tools that give you your time back',
    template: '%s | SlothLabs',
  },
  description:
    'SlothLabs is a dev tools company. We build software that saves time for developers and DevOps: CloudOrbit (cloud session manager), DataOrbit, and more. By devs, for devs.',
  keywords: [
    'SlothLabs',
    'dev tools',
    'developer tools',
    'DevOps tools',
    'CloudOrbit',
    'DataOrbit',
    'SlothLabs products',
  ],
  openGraph: {
    title: 'SlothLabs — Dev tools that give you your time back',
    description: 'We build dev tools for developers and DevOps. CloudOrbit, DataOrbit and more. By devs, for devs.',
    siteName: 'SlothLabs',
    type: 'website',
    url: SITE_URL,
    images: [{ url: '/images/slothlabs-hero.png', width: 1200, height: 630, alt: 'SlothLabs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlothLabs — Dev tools that give you your time back',
    description: 'Dev tools for developers and DevOps. CloudOrbit, DataOrbit. By devs, for devs.',
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
      description: 'SlothLabs builds dev tools for developers and DevOps. CloudOrbit, DataOrbit and more.',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/slothlabs-logo-light.png` },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'SlothLabs',
      description: 'SlothLabs — dev tools: CloudOrbit, DataOrbit and more.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/cloudorbit?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y985GSPRPD"
          strategy="afterInteractive"
        />
        <Script id="google-gtag" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-Y985GSPRPD');`}
        </Script>
      </body>
    </html>
  )
}
