import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'container-orbit Docs — Install, orbit setup, CLI reference, MCP | SlothLabs',
  description:
    'container-orbit (orbit) documentation: install on macOS/Linux/Windows (Homebrew, curl, PowerShell), the guided orbit setup wizard, full CLI reference with every flag, running as a service, verbose logging, the MCP server, and the roadmap.',
  keywords: [
    'container-orbit docs',
    'orbit setup',
    'remote docker over ssh',
    'docker context remote',
    'orbit cli reference',
    'orbit mcp',
    'install remote docker',
    'homebrew orbit',
    'SlothLabs',
  ],
  openGraph: {
    title: 'container-orbit Docs — Install, setup & CLI reference | SlothLabs',
    description:
      'Install on any OS, the 2-minute orbit setup wizard, full CLI reference, service mode, verbose logging, MCP server, and roadmap.',
    url: `${SITE_URL}/container-orbit/docs`,
    siteName: 'SlothLabs',
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/container-orbit/docs` },
}

export default function ContainerOrbitDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
