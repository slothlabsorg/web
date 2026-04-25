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
}
