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
        version: '0.1.0',
        date: '2026-04-25',
        notes: 'Initial release.',
        downloadUrl: 'https://github.com/slothlabsorg/wattsorbit/releases/tag/v0.1.0',
        highlights: [
          'Real-time watts in/out from macOS power APIs',
          'Per-device USB power draw',
          'Battery health panel (cycles, capacity, temperature)',
          'Smart notifications: weak charger, low battery, charge-limit alerts',
          'Cable quality testing',
          'Menu bar tray popup + full dashboard window',
          'Launch at login (LaunchAgent)',
          'In-app update banner',
        ],
      },
    ],
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
