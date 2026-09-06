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
    releases: [
      {
        version: '1.3.0',
        date: '2026-06-02',
        notes: 'See the GitHub release for full details. (This is a build-time fallback; the product page shows the live latest release from GitHub.)',
        downloadUrl: 'https://github.com/slothlabsorg/wattsorbit/releases/latest',
        highlights: [
          'NewsBell in the tray popup — unread dot and release notes dropdown',
          'News screen in the Dashboard with markdown rendering and pull-to-refresh',
          'UpdaterModal replaces UpdateBanner — changelog, download progress, in-app install',
          'Homebrew Cask auto-updates on release publish',
        ],
      },
      {
        version: '1.0.0',
        date: '2026-05-10',
        notes: 'First public release.',
        downloadUrl: 'https://github.com/slothlabsorg/wattsorbit/releases/tag/v1.0.0',
        highlights: [
          'Menu-bar tray with live watt reading (polls every 5 s)',
          'Battery percentage, time remaining, and charge/discharge rate',
          'USB-C device wattage breakdown',
          'Dashboard window with power history chart',
          'macOS, Windows, and Linux support',
        ],
      },
    ],
  },
  cloudorbit: {
    appName: 'CloudOrbit',
    slug: 'cloudorbit',
    accent: '#00D4FF',
    icon: '/images/cloudorbit-icon.png',
    releases: [
      {
        version: '1.0.3',
        date: '2026-06-03',
        notes: 'Build and test release.',
        downloadUrl: 'https://github.com/slothlabsorg/cloudorbit/releases/latest',
        highlights: [
          'AWS SSO session manager — switch accounts without terminal',
          'Auto-updates kubeconfig when switching profiles',
          'EKS cluster detection from active session',
          'Session persistence across app restarts',
          'Region selector per profile',
          'IAM / Chained / Federated auth support',
          'Works behind Cloudflare and corporate proxies',
        ],
      },
    ],
  },
  dataorbit: {
    appName: 'DataOrbit',
    slug: 'dataorbit',
    accent: '#8B5CF6',
    icon: '/images/dataorbit-icon.png',
    releases: [
      {
        version: '1.0.0',
        date: '2026-05-12',
        notes: 'First stable release.',
        downloadUrl: 'https://github.com/slothlabsorg/dataorbit/releases/latest',
        highlights: [
          'Browse DynamoDB tables — grid + JSON views, row detail, schema inspector',
          'Explore — query builder with GSI support and filter expressions',
          'Live DynamoDB Streams — real-time event viewer',
          'Cross-table joins — inner, left, left-anti, right, right-anti',
          'Full query history with search',
          'CouchDB support',
          'Native Rust + Tauri — no Electron, no JVM',
        ],
      },
    ],
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
        version: '0.2.1',
        date: '2026-06-01',
        notes: 'See GitHub release for full details.',
        downloadUrl: 'https://github.com/slothlabsorg/mermaid-preview-plugin/releases/download/v0.2.1/mermaid-preview-0.2.1.zip',
        highlights: [],
      },
      {
        version: '0.1.2',
        date: '2026-05-09',
        notes: 'Bug fixes and stability improvements.',
        downloadUrl: 'https://github.com/slothlabsorg/mermaid-preview-plugin/releases/download/v0.1.2/mermaid-preview-0.1.2.zip',
        highlights: [
          'Bug fixes and stability improvements',
        ],
      },
      {
        version: '0.1.1',
        date: '2026-05-07',
        notes: 'Patch release.',
        downloadUrl: 'https://github.com/slothlabsorg/mermaid-preview-plugin/releases/download/v0.1.1/mermaid-preview-0.1.1.zip',
        highlights: [
          'Patch release',
        ],
      },
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
  ragorbit: {
    appName: 'RAGorbit',
    slug: 'ragorbit',
    accent: '#D946EF',
    icon: '/images/slothlabs-logo-dark.png',
    releases: [
      {
        version: '1.0.1',
        date: '2026-09-05',
        notes: 'First public release. Visual builder for RAG and agentic strategies that generates a deployable Python project.',
        downloadUrl: 'https://github.com/slothlabsorg/ragorbit/releases/latest',
        highlights: [
          'Zero-dependency engine — ships as an 80 KB single-file zipapp that runs on any python3',
          '53 node types in 13 categories, with contract checks that reject a flow that could not work',
          'Real LangGraph/LangChain codegen for all three deployment targets: chat-service, batch, event-worker',
          'Every artifact includes mock services, fixtures and end-to-end tests — green before it has a credential',
          'Rule conditions compiled to Python at generation time, so the artifact contains no eval',
          '10 industry templates, all validated and tested on every commit',
        ],
      },
    ],
  },
}
