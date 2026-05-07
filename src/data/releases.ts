// Static release history for all Orbit apps.
// Updated automatically by /release skill when a new version is cut.

export interface ReleaseEntry {
  version: string
  date: string
  notes: string
  downloadUrl?: string
  highlights?: string[]
}

export interface AppReleases {
  appName: string
  slug: string
  accent: string
  icon: string
  releases: ReleaseEntry[]
}

export const allReleases: Record<string, AppReleases> = {
  wattsorbit: {
    appName: 'WattsOrbit',
    slug: 'wattsorbit',
    accent: '#F59E0B',
    icon: '/images/wattsorbit-icon.png',
    releases: [],
  },
  dataorbit: {
    appName: 'DataOrbit',
    slug: 'dataorbit',
    accent: '#8B5CF6',
    icon: '/images/dataorbit-icon.png',
    releases: [],
  },
  bastionorbit: {
    appName: 'BastionOrbit',
    slug: 'bastionorbit',
    accent: '#10B981',
    icon: '/images/bastionorbit-icon.png',
    releases: [],
  },
  proxyorbit: {
    appName: 'ProxyOrbit',
    slug: 'proxyorbit',
    accent: '#94A3B8',
    icon: '/images/proxyorbit-icon.png',
    releases: [],
  },
  'mermaid-preview': {
    appName: 'Mermaid Preview',
    slug: 'mermaid-preview',
    accent: '#FF3670',
    icon: '/images/mermaid-preview-icon.png',
    releases: [
      {
        version: '0.1.0',
        date: '2026-05-07',
        notes: 'Initial release. Live side-panel preview of all mermaid blocks in Markdown files with per-block toggle and 250ms live-refresh.',
        downloadUrl: 'https://github.com/slothlabsorg/mermaid-preview-plugin/releases/download/v0.1.0/mermaid-preview-0.1.0.zip',
        highlights: [
          'Auto-detects all ```mermaid fenced blocks in .md / .markdown / .mdx',
          'Per-block Diagram ↔ Code segmented toggle',
          '250ms live-refresh as you type — no save required',
          'Theme-aware dark/light rendering via JCEF',
          'Mermaid 10.9.3 bundled — fully offline, air-gapped compatible',
          '12+ diagram types: flowchart, sequence, state, class, ER, Gantt, pie, git graph, mindmap, quadrant, timeline, user journey',
        ],
      },
    ],
  },
}
