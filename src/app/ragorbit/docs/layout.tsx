import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'RAGorbit Docs — Install, the canvas, Flow IR, node catalog, codegen & deploy | SlothLabs',
  description:
    'RAGorbit documentation: install the zipapp or via Homebrew/pipx, run the visual canvas offline, the Flow IR contract, all 53 node types, contract validation, what codegen emits for each deployment target, mock vs real mode, Docker and Cloud Run deploys, extending the catalog, and the CLI reference.',
  keywords: [
    'ragorbit docs',
    'ragorbit install',
    'flow ir',
    'rag node catalog',
    'langgraph codegen',
    'ragorbit cli',
    'rag mock mode',
    'extend rag catalog',
    'deployment targets rag',
    'ragorbit zipapp',
    'SlothLabs',
  ],
  openGraph: {
    title: 'RAGorbit Docs — Install, Flow IR, node catalog & codegen | SlothLabs',
    description:
      'Install in one command, draw a flow, and read exactly what the generator emits. The Flow IR contract, 53 node types, mock vs real mode, and how to add your own technology.',
    url: `${SITE_URL}/ragorbit/docs`,
    siteName: 'SlothLabs',
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/ragorbit/docs` },
}

export default function RagOrbitDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
