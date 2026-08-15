import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'runtime-orbit Docs — Install, donor & borrower setup, CLI reference, MCP | SlothLabs',
  description:
    'runtime-orbit documentation: install on macOS and Linux (Homebrew, curl), donor and borrower setup, in-app authorization and LAN pairing, the live dashboard, RAM budgets and routing tables, full CLI reference, service mode, the MCP server, and upgrading from container-orbit.',
  keywords: [
    'runtime-orbit docs',
    'runtime-orbit setup',
    'runtime-orbit donor',
    'remote docker over ssh',
    'docker context remote',
    'borrow container runtime',
    'runtime-orbit cli reference',
    'runtime-orbit mcp',
    'install remote docker',
    'homebrew runtime-orbit',
    'container-orbit docs',
    'SlothLabs',
  ],
  openGraph: {
    title: 'runtime-orbit Docs — Install, setup & CLI reference | SlothLabs',
    description:
      'Install on any OS, two-minute donor and borrower setup, passwordless pairing, the live dashboard, RAM budgets and routing tables, full CLI reference, and the MCP server.',
    url: `${SITE_URL}/runtime-orbit/docs`,
    siteName: 'SlothLabs',
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/runtime-orbit/docs` },
}

export default function RuntimeOrbitDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
