// Central registry mapping each product slug to its GitHub repo + UI metadata.
// Single source of truth for the download modal and the live "latest release"
// lookups (src/lib/useLatestRelease.ts → /api/releases/<slug>).
//
// NOTE: the URL slug is not always the GitHub repo name — klight lives in the
// `kraken-light` repo and Mermaid Preview in `mermaid-preview-plugin`.

export type AppKind = 'desktop' | 'plugin' | 'python'

export interface AppMeta {
  /** URL slug used on the site (and as the /api/releases/<slug> key). */
  slug: string
  /** GitHub repo name under github.com/slothlabsorg/<repo>. */
  repo: string
  /** Display name. */
  name: string
  /** Square icon in /public/images. */
  icon: string
  /** Brand accent hex. */
  accent: string
  /** desktop = OS/arch installers; plugin = single artifact (e.g. JetBrains zip);
   *  python = OS-agnostic zipapp + wheel (runs on any python3). */
  kind: AppKind
  /** Optional package-manager install commands (shown as a secondary option). */
  brewCmd?: string
  wingetCmd?: string
  aptCmd?: string
  /** Optional changelog/docs link shown under the download. */
  docsUrl?: string
}

export const APPS: Record<string, AppMeta> = {
  cloudorbit: {
    slug: 'cloudorbit', repo: 'cloudorbit', name: 'CloudOrbit',
    icon: '/images/cloudorbit-icon.png', accent: '#00D4FF', kind: 'desktop',
    docsUrl: '/cloudorbit/docs',
  },
  wattsorbit: {
    slug: 'wattsorbit', repo: 'wattsorbit', name: 'WattsOrbit',
    icon: '/images/wattsorbit-icon.png', accent: '#F59E0B', kind: 'desktop',
  },
  dataorbit: {
    slug: 'dataorbit', repo: 'dataorbit', name: 'DataOrbit',
    icon: '/images/dataorbit-icon.png', accent: '#8B5CF6', kind: 'desktop',
  },
  proxyorbit: {
    slug: 'proxyorbit', repo: 'proxyorbit', name: 'ProxyOrbit',
    icon: '/images/proxyorbit-icon.png', accent: '#94A3B8', kind: 'desktop',
  },
  bastionorbit: {
    slug: 'bastionorbit', repo: 'bastionorbit', name: 'BastionOrbit',
    icon: '/images/bastionorbit-icon.png', accent: '#10B981', kind: 'desktop',
  },
  klight: {
    slug: 'klight', repo: 'kraken-light', name: 'klight',
    icon: '/images/klight-logo.png', accent: '#B4FF3C', kind: 'desktop',
  },
  'mermaid-preview': {
    slug: 'mermaid-preview', repo: 'mermaid-preview-plugin', name: 'Mermaid Preview',
    icon: '/images/mermaid-preview-icon.png', accent: '#FF3670', kind: 'plugin',
  },
  ragorbit: {
    slug: 'ragorbit', repo: 'ragorbit', name: 'RAGorbit',
    icon: '/images/slothlabs-logo-dark.png', accent: '#D946EF', kind: 'python',
    brewCmd: 'brew install slothlabsorg/tap/ragorbit',
    docsUrl: '/ragorbit/docs',
  },
}

export function appMeta(slug: string): AppMeta | undefined {
  return APPS[slug]
}

/** github.com/slothlabsorg/<repo>/releases — used by "past releases" buttons. */
export function releasesUrl(slug: string): string {
  const repo = APPS[slug]?.repo ?? slug
  return `https://github.com/slothlabsorg/${repo}/releases`
}
